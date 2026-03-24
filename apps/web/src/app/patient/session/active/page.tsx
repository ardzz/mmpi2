"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PauseCircle, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';

// Mock data to simulate questions
const MOCK_QUESTIONS = [
  "I like mechanics magazines.",
  "I have a good appetite.",
  "I wake up fresh and rested most mornings.",
  "I think I would like the work of a librarian.",
  "I am easily awakened by noise."
];

export default function ActiveSessionPage() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, boolean | null>>({});
  const totalQuestions = MOCK_QUESTIONS.length; // For mockup, using length of array. Normally 567.

  const progressPercentage = Math.round((Object.keys(answers).length / totalQuestions) * 100);

  const handleAnswer = (value: boolean) => {
    setAnswers(prev => ({ ...prev, [currentIndex]: value }));
    
    // Auto-advance after a short delay for smoothness
    setTimeout(() => {
      if (currentIndex < totalQuestions - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        // Submit and redirect
        router.push('/patient/session/submitted');
      }
    }, 400);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const currentAnswer = answers[currentIndex];
  const questionText = MOCK_QUESTIONS[currentIndex];

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-full min-h-[calc(100vh-8rem)]">
      {/* Top Header / Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-[var(--color-primary)] opacity-70" />
          <span className="text-sm font-medium text-[var(--color-on-surface-variant)] uppercase tracking-wider">
            Clinical Assessment
          </span>
        </div>
        
        <button 
          type="button"
          onClick={() => router.push('/patient')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] bg-[var(--color-surface-lowest)] text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] transition-colors shadow-sm text-sm font-medium"
        >
          <PauseCircle className="w-4 h-4" />
          Pause & Save
        </button>
      </div>

      {/* Progress Bar Container */}
      <div className="bg-[var(--color-surface-lowest)] rounded-[var(--radius-lg)] p-6 shadow-[var(--shadow-ambient)] mb-6 flex flex-col gap-4">
        <div className="flex justify-between text-sm font-medium text-[var(--color-on-surface)]">
          <span>Statement {currentIndex + 1} of {totalQuestions}</span>
          <span className="text-[var(--color-on-surface-variant)]">{progressPercentage}% Complete</span>
        </div>
        <div className="w-full h-1.5 bg-[var(--color-surface-low)] rounded-full overflow-hidden">
          <div 
            className="h-full bg-[var(--color-action)] transition-all duration-300 ease-in-out" 
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Main Question Area */}
      <div className="flex-1 bg-[var(--color-surface-lowest)] rounded-[var(--radius-lg)] shadow-[var(--shadow-ambient)] p-8 md:p-16 flex flex-col justify-center items-center text-center relative overflow-hidden">
        
        <div className="max-w-2xl w-full mx-auto flex-1 flex flex-col justify-center">
          <h2 className="text-2xl md:text-3xl font-display font-medium text-[var(--color-on-surface)] leading-relaxed mb-12 min-h-[6rem] flex items-center justify-center">
            "{questionText}"
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 w-full max-w-lg mx-auto">
            <button
              type="button"
              onClick={() => handleAnswer(true)}
              className={`
                relative py-6 md:py-8 px-6 rounded-[var(--radius-lg)] text-lg md:text-xl font-medium transition-all duration-200
                ${currentAnswer === true 
                  ? 'bg-[var(--color-primary)] text-white shadow-[var(--shadow-ambient)] scale-[1.02]' 
                  : 'bg-[var(--color-surface)] text-[var(--color-on-surface)] hover:bg-[var(--color-surface-low)]'
                }
              `}
            >
              True
            </button>
            <button
              type="button"
              onClick={() => handleAnswer(false)}
              className={`
                relative py-6 md:py-8 px-6 rounded-[var(--radius-lg)] text-lg md:text-xl font-medium transition-all duration-200
                ${currentAnswer === false 
                  ? 'bg-[var(--color-primary)] text-white shadow-[var(--shadow-ambient)] scale-[1.02]' 
                  : 'bg-[var(--color-surface)] text-[var(--color-on-surface)] hover:bg-[var(--color-surface-low)]'
                }
              `}
            >
              False
            </button>
          </div>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className={`
            inline-flex items-center gap-2 px-5 py-3 rounded-[var(--radius-md)] font-medium text-sm transition-all
            ${currentIndex === 0 
              ? 'opacity-0 pointer-events-none' 
              : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-lowest)] hover:text-[var(--color-on-surface)]'
            }
          `}
        >
          <ArrowLeft className="w-4 h-4" />
          Previous
        </button>
        
        {/* Next button typically hidden in T/F as it auto-advances, but good for review */}
        <button
          type="button"
          onClick={() => {
            if (currentAnswer !== undefined && currentIndex < totalQuestions - 1) {
              setCurrentIndex(prev => prev + 1);
            } else if (currentAnswer !== undefined && currentIndex === totalQuestions - 1) {
              router.push('/patient/session/submitted');
            }
          }}
          disabled={currentAnswer === undefined}
          className={`
            inline-flex items-center gap-2 px-5 py-3 rounded-[var(--radius-md)] font-medium text-sm transition-all
            ${currentAnswer === undefined
              ? 'opacity-50 cursor-not-allowed text-[var(--color-on-surface-variant)]'
              : 'text-[var(--color-primary)] hover:bg-[var(--color-surface-lowest)]'
            }
          `}
        >
          {currentIndex === totalQuestions - 1 ? 'Submit' : 'Next'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
