import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { StudentRegistrationModal } from '@/components/StudentRegistrationModal';

interface RegistrationGateProps {
  children: React.ReactNode;
}

export function RegistrationGate({ children }: RegistrationGateProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    const checkRegistration = async () => {
      // Only check for authenticated students
      if (!isAuthenticated || !user) {
        setIsChecking(false);
        setShowModal(false);
        return;
      }

      // Only check registration for students
      if (user.role !== 'student') {
        setIsChecking(false);
        setShowModal(false);
        return;
      }

      console.log('[RegistrationGate] Checking registration for student:', user.id);

      try {
        const response = await fetch('/api/student/registration', { credentials: 'include' });
        console.log('[RegistrationGate] Response status:', response.status);
        
        if (!response.ok) {
          // If 404 or error, show modal (no registration exists)
          console.log('[RegistrationGate] Response not OK, showing modal');
          setShowModal(true);
          setIsChecking(false);
          return;
        }
        const data = await response.json();
        console.log('[RegistrationGate] Registration data:', data);
        if (!data) {
          // No registration data, show modal
          console.log('[RegistrationGate] No data, showing modal');
          setShowModal(true);
        } else {
          // Registration exists, don't show modal
          console.log('[RegistrationGate] Registration exists, hiding modal');
          setShowModal(false);
        }
      } catch (error) {
        console.error('[RegistrationGate] Error checking registration:', error);
        // On error, show modal to be safe
        setShowModal(true);
      } finally {
        setIsChecking(false);
      }
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
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
      />
    </>
  );
}
