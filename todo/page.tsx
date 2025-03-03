"use client";

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';


export default function TodoList() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');

  // Fetch todos on component mount
  useEffect(() => {
    fetchTodos();
    const subscription = subscribeToTodos();

    // Cleanup subscription on unmount
    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, []);

  // Fetch todos from Supabase
  const fetchTodos = async () => {
    const { data, error } = await supabase.from('todos').select('*').order('id', { ascending: true });
    if (error) console.error('Error fetching todos:', error);
    else setTodos(data);
  };

  // Subscribe to real-time changes
  const subscribeToTodos = () => {
    const subscription = supabase
      .channel('todos') // Unique channel name
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'todos' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTodos((prev) => [...prev, payload.new]);
          } else if (payload.eventType === 'DELETE') {
            setTodos((prev) => prev.filter((todo) => todo.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setTodos((prev) =>
              prev.map((todo) => (todo.id === payload.new.id ? payload.new : todo))
            );
          }
        }
      )
      .subscribe();

    return subscription;
  };

  // Add a new todo
  const addTodo = async () => {
    if (!newTodo.trim()) return;
    const { data, error } = await supabase.from('todos').insert([{ task: newTodo }]);
    if (error) console.error('Error adding todo:', error);
    else setNewTodo('');
  };

  // Delete a todo
  const deleteTodo = async (id) => {
    const { error } = await supabase.from('todos').delete().eq('id', id);
    if (error) console.error('Error deleting todo:', error);
  };

  // Toggle todo completion
  const toggleTodo = async (id, completed) => {
    const { error } = await supabase.from('todos').update({ completed: !completed }).eq('id', id);
    if (error) console.error('Error updating todo:', error);
  };

  return (
    <div>
      <h1>Todo List</h1>
      <div>
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Add a new task"
        />
        <button onClick={addTodo}>Add</button>
      </div>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id, todo.completed)}
            />
            <span style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
              {todo.task}
            </span>
            <button onClick={() => deleteTodo(todo.id)}>Delete</button>
          </li>
        ))}
      </ul>
      
    </div>
  );
}