'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { Paperclip, ArrowRight, ArrowLeft } from 'lucide-react'

export default function TaskPage() {
  // Force a black background immediately
  useEffect(() => {
    document.documentElement.style.backgroundColor = "#000000";
    document.body.style.backgroundColor = "#000000";
  }, []);

  const params = useParams();
  const taskId = params?.tasksId;
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [followUpPrompt, setFollowUpPrompt] = useState('');
  const containerRef = useRef(null);
  const eventSourceRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);
  
  // Simple task data fetching
  useEffect(() => {
    // Black background first thing
    document.documentElement.style.backgroundColor = "#000000";
    document.body.style.backgroundColor = "#000000";
    
    if (!taskId) {
      setError('No task ID provided');
      setLoading(false);
      return;
    }
    
    // Fetch initial task data
    const fetchTask = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks/${taskId}`);
        if (!response.ok) throw new Error(`Failed to load task: ${response.statusText}`);
        
        const data = await response.json();
        setTask(data);
      } catch (err) {
        setError(err.message || 'Failed to load task');
      } finally {
        setLoading(false);
      }
    };
    
    // Set up SSE stream
    const setupEventSource = () => {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/tasks/${taskId}/events`;
      console.log(`Connecting to SSE at ${apiUrl}`);
      
      const eventSource = new EventSource(apiUrl);
      eventSourceRef.current = eventSource;
      
      // Very simple message handlers
      eventSource.onopen = () => console.log('SSE connection open');
      
      eventSource.addEventListener('status', (event) => {
        try {
          const data = JSON.parse(event.data);
          setTask(prev => ({...prev, ...data}));
          if (data.status === 'completed') {
            setIsTyping(false);
          } else {
            setIsTyping(true);
          }
        } catch (e) {
          console.error('Error parsing status:', e);
        }
      });
      
      ['think', 'tool', 'act', 'log', 'result'].forEach(type => {
        eventSource.addEventListener(type, (event) => {
          try {
            const data = JSON.parse(event.data);
            setTask(prev => {
              if (!prev || !prev.steps) return prev;
              
              // Check if we already have this step
              const existingStepIndex = prev.steps.findIndex(s => 
                s.step === data.step && s.type === data.type
              );
              
              const newSteps = [...prev.steps];
              if (existingStepIndex >= 0) {
                newSteps[existingStepIndex] = data;
              } else {
                newSteps.push(data);
              }
              
              return {
                ...prev,
                steps: newSteps
              };
            });
            
            // Scroll to bottom on new content
            setTimeout(() => {
              if (containerRef.current) {
                containerRef.current.scrollTop = containerRef.current.scrollHeight;
              }
            }, 100);
          } catch (e) {
            console.error(`Error parsing ${type}:`, e);
          }
        });
      });
      
      eventSource.onerror = () => {
        console.error('SSE error');
        eventSource.close();
      };
      
      return () => {
        console.log('Closing SSE connection');
        eventSource.close();
      };
    };
    
    fetchTask();
    const cleanup = setupEventSource();
    
    return cleanup;
  }, [taskId]);

  // Handle follow-up prompt
  const handleFollowUpSubmit = (e) => {
    e.preventDefault();
    if (!followUpPrompt.trim()) return;
    
    // Just simulate for now (placeholder)
    setIsTyping(true);
    setFollowUpPrompt('');
    
    // Add a message saying this isn't implemented yet
    setTimeout(() => {
      setIsTyping(false);
      // Would normally connect to backend here
    }, 2000);
  };

  // Basic loading state with sleek animation
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 border-2 border-[#10A37F] border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="mt-6 text-sm text-[#BBBBBB] font-light">Loading task...</p>
        </div>
      </div>
    );
  }
  
  // Error state - more minimal
  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-[#111] p-6 rounded-md border border-[#363636]">
          <div className="w-12 h-12 mx-auto flex items-center justify-center rounded-full bg-red-900/20 mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="text-xl text-center font-light mb-4">Error</h2>
          <p className="text-center text-[#BBBBBB] mb-6">{error}</p>
          <div className="flex justify-center space-x-4">
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-[#363636] hover:bg-[#444] rounded-md transition-colors text-sm"
            >
              Retry
            </button>
            <a 
              href="/"
              className="px-4 py-2 bg-[#10A37F] hover:bg-[#0D8A6C] rounded-md transition-colors text-sm"
            >
              Go Home
            </a>
          </div>
        </div>
      </div>
    );
  }
  
  const formatContent = (content) => {
    if (typeof content !== 'string') return content;
    
    // Check for code blocks
    if (content.includes('```')) {
      // Split by code blocks and process each segment
      const segments = content.split(/(```[\s\S]*?```)/g);
      return segments.map((segment, i) => {
        if (segment.startsWith('```') && segment.endsWith('```')) {
          // Extract language if specified
          const firstLineEnd = segment.indexOf('\n');
          const language = segment.substring(3, firstLineEnd).trim();
          const code = segment.substring(firstLineEnd + 1, segment.length - 3).trim();
          
          return (
            <div key={i} className="code-block my-2">
              <div className="flex justify-between items-center bg-[#222] px-3 py-1 rounded-t-md">
                <span className="text-xs text-gray-400">{language || 'Code'}</span>
                <button 
                  onClick={() => navigator.clipboard.writeText(code)}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Copy
                </button>
              </div>
              <pre className="bg-[#111] p-3 rounded-b-md overflow-x-auto">
                <code>{code}</code>
              </pre>
            </div>
          );
        }
        
        // Regular text
        return <p key={i} className="mb-2">{segment}</p>;
      });
    }
    
    return content;
  };
  
  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Header - more minimal with logo */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-[#363636]">
        <div className="flex items-center space-x-3">
          <div className="flex items-center">
            <img 
              src="/logo.png" 
              alt="Magnus Logo" 
              width={20} 
              height={20} 
              className="mr-1" 
            />
            <h1 className="text-[26px] brand-heading text-[#BBBBBB]">
              <span className="font-light">magnus</span>
            </h1>
          </div>
        </div>
        <div className='flex items-center space-x-1.5'>
        <a href="/" className="p-1 rounded hover:bg-[#222] transition-colors flex items-center justify-center">
            <ArrowLeft className="h-4 w-4 text-gray" />
          </a>
          <span className={`text-xs px-3 py-2 rounded-md font-bold ${
            task?.status === 'completed' ? 'bg-[#0D8A6C]/30 text-green-400' :
            task?.status === 'running' ? 'bg-blue-900/30 text-blue-400' :
            task?.status?.includes('failed') ? 'bg-red-900/30 text-red-400' :
            'bg-[#363636] text-[#BBBBBB]'
          }`}>
            {task?.status || 'Unknown'}
          </span>
        </div>
      </header>
      
      {/* Chat container */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 bg-black minimal-scrollbar"
      >
        {/* User message */}
        <div className="flex justify-end mb-6">
          <div className="bg-[#10A37F] py-2 px-4 rounded-lg max-w-[80%] shadow-sm">
            <p className="text-sm">{task?.prompt || ''}</p>
          </div>
        </div>
        
        {/* AI responses */}
        {task?.steps && task.steps.map((step, index) => {
          // Skip status updates
          if (step.type === 'status') return null;
          
          // Determine the appropriate icon based on step type
          let icon = null;
          if (step.type === 'think') icon = '✨';
          else if (step.type === 'tool') icon = '🛠️';
          else if (step.type === 'act') icon = '🎯';
          else if (step.type === 'result') icon = '✓';
          else if (step.type === 'error') icon = '⚠️';
          
          return (
            <div key={index} className="flex mb-6 items-start fade-in">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#222] border border-[#363636] flex items-center justify-center mr-2">
                <span className="text-sm">{icon || 'M'}</span>
              </div>
              <div className={`py-3 px-4 rounded-lg max-w-[80%] text-sm bg-[#111] border border-[#363636] ${
                step.type === 'error' ? 'border-red-500/30' : ''
              }`}>
                <div className="whitespace-pre-wrap">
                  {formatContent(step.result)}
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Typing indicator */}
        {isTyping && (
          <div className="flex mb-6 items-start fade-in">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#222] border border-[#363636] flex items-center justify-center mr-2">
              <span className="text-sm">M</span>
            </div>
            <div className="py-3 px-4 rounded-lg bg-[#111] border border-[#363636]">
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Input area */}
      <div className="px-4 py-3 border-[#363636]">
        <form onSubmit={handleFollowUpSubmit} className="relative">
          <div className="relative shadow-lg rounded-lg elegant-input overflow-hidden">
            
            <input
              type="text"
              value={followUpPrompt}
              onChange={(e) => setFollowUpPrompt(e.target.value)}
              placeholder="Ask a follow-up question..."
              className="w-full bg-transparent text-white py-4
               pl-4 pr-20 w-max-[200px] focus:outline-none text-sm"
            />
            
            {/* Attachment button - positioned to the right */}
            <button
              type="button"
              className="absolute right-14 top-1/2 transform -translate-y-1/2 attachment-button flex items-center justify-center p-1"
            >
              <Paperclip className="h-4 w-4 text-gray-400 hover:text-white transition-colors" />
            </button>
            
            {/* Submit button - white squared background */}
            <button
              type="submit"
              disabled={!followUpPrompt.trim()}
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 rounded-md flex items-center justify-center ${
                !followUpPrompt.trim() 
                  ? 'opacity-50 cursor-not-allowed bg-gray-700' 
                  : 'opacity-100 bg-white hover:bg-gray-200'
              } p-1.5`}
            >
              <ArrowRight className="h-4 w-4 text-black" />
            </button>
          </div>
        </form>
        {/* <p className="text-xs text-center text-gray-500 mt-2">
          Magnus may produce mind-blowing results
        </p> */}
      </div>
    </div>
  );
}