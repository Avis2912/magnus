'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LogoTransition from './components/LogoTransition'
import { Paperclip, ArrowRight } from 'lucide-react'

interface Task {
  id: string;
  prompt: string;
  status: string;
  created_at: string;
}

export default function Home() {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [recentTasks, setRecentTasks] = useState<Task[]>([])
  const [showLogoTransition, setShowLogoTransition] = useState(false)
  const router = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  
  useEffect(() => {
    // Fetch recent tasks
    const fetchRecentTasks = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks`);
        if (response.ok) {
          const data = await response.json();
          setRecentTasks(data.slice(0, 5)); // Take only the 5 most recent
        }
      } catch (err) {
        console.error("Failed to fetch recent tasks:", err);
      }
    };
    
    fetchRecentTasks();
    
    // Auto-focus the textarea
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Example prompts
  const examplePrompts = [
    "Analyze my recent email conversations",
    "Create an excel template for monthly expenses",
    "Find and organize new papers on climate change",
    "Plan my vacation itinerary to Japantown, SF"
  ];

  const handleExampleClick = (example: string): void => {
    setPrompt(example);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!prompt.trim()) return
    
    setLoading(true)
    setError('')
    setShowLogoTransition(true)
    
    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/tasks`
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt })
      })
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (!data || !data.task_id) {
        throw new Error('No valid task ID returned from server')
      }
      
      // Store task ID
      localStorage.setItem('lastTaskId', data.task_id)
      
      // We don't need an additional delay since the logo animation is the loading screen
      window.location.href = `/tasks/${data.task_id}`
      
    } catch (err) {
      console.error("Error creating task:", err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      setLoading(false)
      setShowLogoTransition(false)
    }
  }

  const handleKeyDown = (e) => {
    // Submit on Enter without Shift
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
    
    // Auto resize textarea
    if (textareaRef.current) {
      setTimeout(() => {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
      }, 0);
    }
  };
  
  return (
    <>
      {showLogoTransition && <LogoTransition />}
      
      <div className="flex flex-col min-h-screen bg-black text-white">
        {/* Main content */}
        <main className="flex-1 flex flex-col items-center justify-center px-4">
          {/* Logo at the top center */}
          <div className="flex items-center mb-8">
            <img 
              src="/logo.png" 
              alt="Magnus Logo" 
              width={48} 
              height={48} 
              className="mr-1.5 mt-2"
            />
            <h1 className="text-7xl font-normal brand-heading">
              <span className="font-light">magnus</span>
            </h1>
          </div>
          
          {/* Centered input area */}
          <div className="w-full max-w-2xl mx-auto mb-4">
            <form ref={formRef} onSubmit={handleSubmit} className="relative">
              <div className="relative shadow-lg rounded-lg elegant-input overflow-hidden">
                <textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Magnus anything..."
                  className="w-full bg-transparent text-white resize-none overflow-hidden py-4 pl-5 pr-14 focus:outline-none min-h-[60px]"
                  disabled={loading}
                  rows={1}
                />
                
                {/* Attachment button - Positioned to the right */}
                <button
                  type="button"
                  className="absolute right-14 bottom-1/2 transform translate-y-2/5
                   attachment-button flex items-center justify-center p-2"
                >
                  <Paperclip className="h-4 w-4 text-gray-400 hover:text-white transition-colors" />
                </button>
                
                {/* Submit button - White squared background */}
                <button
                  type="submit"
                  disabled={loading || !prompt.trim()}
                  className={`absolute right-4 bottom-1/2 transform translate-y-2/5
                     rounded-md transition-all flex items-center justify-center ${
                    loading || !prompt.trim() 
                      ? 'opacity-50 cursor-not-allowed bg-gray-700' 
                      : 'opacity-100 bg-white hover:bg-gray-200'
                  } p-1.5`}
                >
                  {loading ? (
                    <div className="loading-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  ) : (
                    <ArrowRight className="h-4 w-4 text-black" />
                  )}
                </button>
              </div>
              
              {error && (
                <div className="mt-1 p-3 bg-red-500/30 border border-red-500 rounded-lg text-red-200 text-sm">
                  {error}
                </div>
              )}
            </form>
          </div>
          
          {/* Examples */}
          <div className="w-full max-w-2xl mx-auto">
            {/* <h3 className="text-sm uppercase tracking-wider text-[#777] mb-2 text-center">Examples</h3> */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-0">
              {examplePrompts.map((example, index) => (
                <button 
                  key={index} 
                  className="p-3 px-3 text-[13px] text-left bg-[#161616] hover:bg-[#1E1E1E] 
                  rounded-md border border-[#363636] transition-colors cursor-pointer"
                  onClick={() => handleExampleClick(example)}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
          
          {/* Recent Tasks - smaller, more minimal */}
          {recentTasks.length > 0 && (
            <div className="w-full max-w-2xl mx-auto mt-8">
              <h3 className="text-sm uppercase tracking-wider text-[#777] mb-2 text-center">Recent Tasks</h3>
              <div className="space-y-1.5">
                {recentTasks.map((task) => (
                  <a 
                    key={task.id} 
                    href={`/tasks/${task.id}`}
                    className="block p-2.5 bg-[#161616] hover:bg-[#1E1E1E] rounded-md border border-[#363636] cursor-pointer transition-colors"
                  >
                    <p className="text-sm truncate">{task.prompt}</p>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-[#777]">
                        {new Date(task.created_at).toLocaleString()}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        task.status === 'completed' ? 'bg-[#0D8A6C]/30 text-green-400' :
                        task.status === 'running' ? 'bg-blue-900/30 text-blue-400' :
                        task.status?.includes('failed') ? 'bg-red-900/30 text-red-400' :
                        'bg-[#363636] text-gray-400'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  )
}