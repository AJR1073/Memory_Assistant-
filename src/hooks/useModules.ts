import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { ModuleType, UserModuleSettings } from '../modules/types';
import { moduleConfig } from '../modules/config';

export function useModules() {
  const { currentUser } = useAuth();
  const [userModules, setUserModules] = useState<UserModuleSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserModules() {
      if (!currentUser) {
        setUserModules(null);
        setLoading(false);
        return;
      }

      try {
        const userModulesRef = doc(db, 'userModules', currentUser.uid);
        const userModulesDoc = await getDoc(userModulesRef);

        if (userModulesDoc.exists()) {
          setUserModules(userModulesDoc.data() as UserModuleSettings);
        } else {
          // Initialize with default settings
          const defaultSettings: UserModuleSettings = {
            userId: currentUser.uid,
            enabledModules: ['scripture'],
            role: 'user'
          };
          await setDoc(userModulesRef, defaultSettings);
          setUserModules(defaultSettings);
        }
      } catch (error) {
        console.error('Error fetching user modules:', error);
      }

      setLoading(false);
    }

    fetchUserModules();
  }, [currentUser]);

  const hasModuleAccess = (moduleId: ModuleType) => {
    if (!userModules || !currentUser) return false;
    
    const module = moduleConfig[moduleId];
    if (!module) return false;

    const hasRole = userModules.role === 'admin' || 
                   (module.requiredRole === 'user') ||
                   (module.requiredRole === 'premium' && userModules.role === 'premium');
                   
    return module.enabled && hasRole && userModules.enabledModules.includes(moduleId);
  };

  const toggleModule = async (moduleId: ModuleType) => {
    if (!currentUser || !userModules) return;

    try {
      const updatedModules = userModules.enabledModules.includes(moduleId)
        ? userModules.enabledModules.filter(id => id !== moduleId)
        : [...userModules.enabledModules, moduleId];

      const userModulesRef = doc(db, 'userModules', currentUser.uid);
      await setDoc(userModulesRef, {
        ...userModules,
        enabledModules: updatedModules
      });

      setUserModules({
        ...userModules,
        enabledModules: updatedModules
      });
    } catch (error) {
      console.error('Error toggling module:', error);
    }
  };

  return {
    userModules,
    loading,
    hasModuleAccess,
    toggleModule
  };
}
