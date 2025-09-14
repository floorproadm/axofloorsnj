import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  targetDate: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const CountdownTimer = ({ targetDate }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const difference = target - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const TimeUnit = ({ value, unit }: { value: number; unit: string }) => (
    <div className="bg-navy/20 rounded-lg p-3 min-w-[60px]">
      <div className="text-2xl md:text-3xl font-bold font-heading">
        {value.toString().padStart(2, '0')}
      </div>
      <div className="text-sm font-medium uppercase tracking-wide">
        {unit}
      </div>
    </div>
  );

  return (
    <div className="flex justify-center items-center gap-3">
      <TimeUnit value={timeLeft.days} unit="Dias" />
      <div className="text-2xl font-bold">:</div>
      <TimeUnit value={timeLeft.hours} unit="Horas" />
      <div className="text-2xl font-bold">:</div>
      <TimeUnit value={timeLeft.minutes} unit="Min" />
      <div className="text-2xl font-bold">:</div>
      <TimeUnit value={timeLeft.seconds} unit="Seg" />
    </div>
  );
};