import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { StudentRegistrationModal } from '@/components/StudentRegistrationModal';
import { TutorRegistrationModal } from '@/components/TutorRegistrationModal';

interface RegistrationGateProps {
  children: React.ReactNode;
}

export function RegistrationGate({ children }: RegistrationGateProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showTutorModal, setShowTutorModal] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    const checkRegistration = async () => {
      if (!isAuthenticated || !user) {
        setIsChecking(false);
        return;
      }

      // ── Student check ──────────────────────────────────────────────────────
      if (user.role === 'student') {
        console.log('[RegistrationGate] Checking student registration:', user.id);
        try {
          const response = await fetch('/api/student/registration', { credentials: 'include' });
          if (!response.ok) {
            setShowStudentModal(true);
            return;
          }
          const data = await response.json();
          console.log('[RegistrationGate] Student data:', data);
          setShowStudentModal(!data);
        } catch (error) {
          console.error('[RegistrationGate] Error checking student registration:', error);
          setShowStudentModal(true);
        } finally {
          setIsChecking(false);
        }
        return;
      }

      // ── Teacher check ──────────────────────────────────────────────────────
      if (user.role === 'teacher') {
        console.log('[RegistrationGate] Checking tutor registration:', user.id);
        try {
          const response = await fetch('/api/tutor/registration', { credentials: 'include' });
          if (!response.ok) {
            setShowTutorModal(true);
            return;
          }
          const data = await response.json();
          console.log('[RegistrationGate] Tutor data:', data);
          setShowTutorModal(!data);
        } catch (error) {
          console.error('[RegistrationGate] Error checking tutor registration:', error);
          setShowTutorModal(true);
        } finally {
          setIsChecking(false);
        }
        return;
      }

      // ── Admin or other roles — skip registration check ────────────────────
      setIsChecking(false);
    };

    checkRegistration();
  }, [isAuthenticated, user]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your profile...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      {children}
      <StudentRegistrationModal
        isOpen={showStudentModal}
        onClose={() => setShowStudentModal(false)}
      />
      <TutorRegistrationModal
        isOpen={showTutorModal}
        onClose={() => setShowTutorModal(false)}
      />
    </>
  );
}
