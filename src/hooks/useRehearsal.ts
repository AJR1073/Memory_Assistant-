import { useState, useEffect } from 'react';
import { collection, doc, setDoc, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { addDays, isAfter, isBefore, startOfDay } from 'date-fns';

export interface RehearsalSchedule {
  id: string;
  verseId: string;
  userId: string;
  reference: string;
  scheduledDate: Date;
  completed: boolean;
  completedAt?: Date;
  accuracy?: number;
  nextRehearsalDate?: Date;
  frequency?: number; // days between rehearsals
  recurringId?: string; // to group recurring rehearsals
}

// Spaced repetition intervals (in days)
const REHEARSAL_INTERVALS = [1, 3, 7, 14, 30, 90];

// Predefined frequency options (in days)
export const FREQUENCY_OPTIONS = [
  { label: 'Daily', value: 1 },
  { label: 'Every Other Day', value: 2 },
  { label: 'Twice a Week', value: 3 },
  { label: 'Weekly', value: 7 },
  { label: 'Bi-weekly', value: 14 },
  { label: 'Monthly', value: 30 },
];

export function useRehearsal() {
  const [schedules, setSchedules] = useState<RehearsalSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  // Subscribe to rehearsal schedules
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      const q = query(
        collection(db, 'rehearsals'),
        where('userId', '==', currentUser.uid),
        orderBy('scheduledDate', 'asc')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const rehearsalData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            scheduledDate: doc.data().scheduledDate?.toDate(),
            completedAt: doc.data().completedAt?.toDate(),
            nextRehearsalDate: doc.data().nextRehearsalDate?.toDate(),
          })) as RehearsalSchedule[];

          setSchedules(rehearsalData);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('Error in rehearsal listener:', err);
          setError('Failed to load rehearsal schedules');
          setLoading(false);
          setSchedules([]);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up rehearsal listener:', err);
      setError('Failed to set up rehearsal schedules');
      setLoading(false);
      setSchedules([]);
    }
  }, [currentUser]);

  // Get today's rehearsals
  const getTodayRehearsals = () => {
    const today = startOfDay(new Date());
    return schedules.filter(
      (schedule) => 
        !schedule.completed && 
        isBefore(schedule.scheduledDate, addDays(today, 1)) &&
        isAfter(schedule.scheduledDate, addDays(today, -1))
    );
  };

  // Get upcoming rehearsals
  const getUpcomingRehearsals = () => {
    const today = startOfDay(new Date());
    return schedules.filter(
      (schedule) => 
        !schedule.completed && 
        isAfter(schedule.scheduledDate, today)
    );
  };

  // Schedule a new rehearsal
  const scheduleRehearsal = async (
    verseId: string,
    reference: string,
    initialSchedule = true,
    customDate?: Date,
    frequency?: number
  ) => {
    if (!currentUser) throw new Error('Must be logged in to schedule rehearsals');

    try {
      const today = new Date();
      const recurringId = frequency ? `${verseId}_${Date.now()}` : undefined;
      const scheduledDate = customDate || addDays(today, initialSchedule ? 1 : REHEARSAL_INTERVALS[0]);

      // Create the first rehearsal
      const rehearsalId = `${verseId}_${Date.now()}`;
      await setDoc(doc(db, 'rehearsals', rehearsalId), {
        verseId,
        userId: currentUser.uid,
        reference,
        scheduledDate,
        completed: false,
        createdAt: today,
        frequency,
        recurringId,
      });

      // If frequency is set, create additional rehearsals
      if (frequency && frequency > 0) {
        const numberOfSchedules = 12; // Create next 12 occurrences
        for (let i = 1; i < numberOfSchedules; i++) {
          const futureDate = addDays(scheduledDate, frequency * i);
          const futureId = `${verseId}_${Date.now()}_${i}`;
          await setDoc(doc(db, 'rehearsals', futureId), {
            verseId,
            userId: currentUser.uid,
            reference,
            scheduledDate: futureDate,
            completed: false,
            createdAt: today,
            frequency,
            recurringId,
          });
        }
      }

      return rehearsalId;
    } catch (err) {
      console.error('Error scheduling rehearsal:', err);
      throw new Error('Failed to schedule rehearsal');
    }
  };

  // Complete a rehearsal
  const completeRehearsal = async (
    rehearsalId: string,
    accuracy: number
  ) => {
    if (!currentUser) throw new Error('Must be logged in to complete rehearsals');

    try {
      const rehearsal = schedules.find(r => r.id === rehearsalId);
      if (!rehearsal) throw new Error('Rehearsal not found');

      const completedCount = schedules.filter(
        r => r.verseId === rehearsal.verseId && r.completed
      ).length;

      // If it's a recurring rehearsal, calculate next date based on frequency
      let nextRehearsalDate: Date;
      if (rehearsal.frequency) {
        nextRehearsalDate = addDays(new Date(), rehearsal.frequency);
      } else {
        // Use spaced repetition for non-recurring rehearsals
        const nextInterval = REHEARSAL_INTERVALS[Math.min(
          completedCount,
          REHEARSAL_INTERVALS.length - 1
        )];
        nextRehearsalDate = addDays(new Date(), nextInterval);
      }

      // Update current rehearsal
      await setDoc(
        doc(db, 'rehearsals', rehearsalId),
        {
          completed: true,
          completedAt: new Date(),
          accuracy,
          nextRehearsalDate,
        },
        { merge: true }
      );

      // Schedule next rehearsal if not recurring
      if (!rehearsal.frequency) {
        await scheduleRehearsal(rehearsal.verseId, rehearsal.reference, false);
      }
    } catch (err) {
      console.error('Error completing rehearsal:', err);
      throw new Error('Failed to complete rehearsal');
    }
  };

  return {
    schedules,
    loading,
    error,
    getTodayRehearsals,
    getUpcomingRehearsals,
    scheduleRehearsal,
    completeRehearsal,
  };
}
