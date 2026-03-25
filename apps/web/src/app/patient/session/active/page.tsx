"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PauseCircle, ArrowLeft, ShieldCheck, Loader2 } from 'lucide-react';
import { fetchApi } from '../../../../lib/api-client';
import { AnswerState } from '@mmpi2/contracts';

const MOCK_QUESTIONS = Array.from({ length: 50 }).map((_, i) => `This is statement number ${i + 1}.`);

interface SessionAnswerResponse {
  questionNumber: number;
  answerState: (typeof AnswerState)[keyof typeof AnswerState];
}

interface SessionStateResponse {
  answers: SessionAnswerResponse[];
}

function ActiveSessionInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestId = searchParams.get('requestId');
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, boolean | null>>({});
  const [loading, setLoading] = useState(true);
  const totalQuestions = MOCK_QUESTIONS.length;

  useEffect(() => {
    if (!requestId) {
      router.push('/patient');
      return;
    }

    fetchApi<SessionStateResponse>(`/workflow/requests/${requestId}/session`)
      .then(data => {
        if (data?.answers) {
          const loadedAnswers: Record<number, boolean> = {};
          let maxAnsweredIndex = -1;
          for (const ans of data.answers) {
            if (ans.answerState === AnswerState.UNANSWERED) {
              continue;
            }

            loadedAnswers[ans.questionNumber - 1] = ans.answerState === AnswerState.TRUE;
            if (ans.questionNumber - 1 > maxAnsweredIndex) {
              maxAnsweredIndex = ans.questionNumber - 1;
            }
          }
          setAnswers(loadedAnswers);
          setCurrentIndex(Math.min(maxAnsweredIndex + 1, totalQuestions - 1));
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load session:', err);
        setLoading(false);
      });
  }, [requestId, router, totalQuestions]);

  const progressPercentage = Math.round((Object.keys(answers).length / totalQuestions) * 100);

  const saveAnswersBatch = async (newAnswers: Record<number, boolean | null>) => {
    if (!requestId) return;
    
    const batch = Object.entries(newAnswers).map(([idx, val]) => ({
      questionNumber: Number.parseInt(idx, 10) + 1,
      answer: val ? 'true' : 'false',
    }));

    try {
      await fetchApi(`/workflow/requests/${requestId}/session/answers`, {
        method: 'PUT',
        body: JSON.stringify({ answers: batch }),
      });
    } catch (error) {
      console.error('Failed to save answers:', error);
    }
  };

  const handleAnswer = (value: boolean) => {
    const newAnswers = { ...answers, [currentIndex]: value };
    setAnswers(newAnswers);
    saveAnswersBatch({ [currentIndex]: value });
    
    setTimeout(() => {
      if (currentIndex < totalQuestions - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        submitSession();
      }
    }, 400);
  };

  const submitSession = async () => {
    if (!requestId) return;
    try {
      await fetchApi(`/workflow/requests/${requestId}/session/submit`, {
        method: 'POST',
      });
      router.push(`/patient/session/submitted?requestId=${requestId}`);
    } catch (error) {
      console.error('Failed to submit session:', error);
      router.push(`/patient/session/submitted?requestId=${requestId}`);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  const currentAnswer = answers[currentIndex];
  const questionText = MOCK_QUESTIONS[currentIndex];

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-full min-h-[calc(100vh-8rem)]">
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

        <div className="text-sm text-[var(--color-on-surface-variant)]">
          {currentIndex + 1} / {totalQuestions}
        </div>
      </div>
    </div>
  );
}

export default function ActiveSessionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
        </div>
      }
    >
      <ActiveSessionInner />
    </Suspense>
  );
}
