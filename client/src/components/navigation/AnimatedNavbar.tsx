"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type Variants } from 'framer-motion';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  GraduationCap,
  BookOpen,
  Search,
  HelpCircle,
  LayoutDashboard,
  ClipboardList,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Sun,
  Moon,
  FileText,
  Brain,
  Award,
  Users,
  Settings,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/context/ThemeContext';
import { StaggeredMenu } from '@/components/StaggeredMenu';
import { TutorRegistrationModal } from '@/components/TutorRegistrationModal';

// Types for navigation
interface NavLink {
  text: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface DropdownColumn {
  heading: string;
  links: NavLink[];
}

type DropdownData = DropdownColumn[];

interface MenuItem {
  label: string;
  href: string;
  dropdownData?: DropdownData;
  boardKey?: string;
}

type AnimationDirection = 'right-to-left' | 'left-to-right';

const subjectsDropdownData: DropdownData = [
  {
    heading: 'By Board',
    links: [
      { text: 'CAIE', href: '/curriculum/caie', icon: Award },
      { text: 'IB', href: '/curriculum/ib', icon: Award },
      { text: 'Edexcel', href: '/curriculum/edexcel', icon: Award },
    ]
  },
  {
    heading: 'Browse',
    links: [
      { text: 'All Subjects', href: '/subjects', icon: Search },
      { text: 'Resources Hub', href: '/subjects', icon: BookOpen },
      { text: 'Help Center', href: '/help', icon: HelpCircle },
    ]
  },
  {
    heading: 'Practice',
    links: [
      { text: 'MCQ Practice', href: '/student/mcq/practice', icon: Brain },
      { text: 'Student Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
    ]
  }
];

const notesDropdownData: DropdownData = [
  {
    heading: 'Notes',
    links: [
      { text: 'CAIE Notes', href: '/subjects', icon: BookOpen },
      { text: 'IB Notes', href: '/subjects', icon: BookOpen },
      { text: 'Edexcel Notes', href: '/subjects', icon: BookOpen },
    ]
  },
  {
    heading: 'More',
    links: [
      { text: 'Videos', href: '/subjects', icon: BookOpen },
      { text: 'Past Papers', href: '/subjects', icon: FileText },
    ]
  }
];

// Student dashboard dropdown
const studentDropdownData: DropdownData = [
  {
    heading: 'Learning',
    links: [
      { text: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
      { text: 'Study Materials', href: '/student/materials', icon: BookOpen },
      { text: 'MCQ Practice', href: '/student/mcq/practice', icon: Brain },
      { text: 'Assignments', href: '/student/assignments', icon: ClipboardList },
    ]
  },
  {
    heading: 'Progress',
    links: [
      { text: 'Quiz History', href: '/student/practice/history', icon: FileText },
      { text: 'Statistics', href: '/student/mcq/stats', icon: BarChart3 },
      { text: 'Announcements', href: '/student/announcements', icon: Bell },
    ]
  },
  {
    heading: 'Account',
    links: [
      { text: 'Profile', href: '/student/profile', icon: User },
      { text: 'Settings', href: '/student/profile', icon: Settings },
    ]
  }
];

// Teacher dropdown data
const teacherDropdownData: DropdownData = [
  {
    heading: 'Teaching',
    links: [
      { text: 'Dashboard', href: '/teacher/dashboard', icon: LayoutDashboard },
      { text: 'My Materials', href: '/teacher/materials', icon: BookOpen },
      { text: 'Quizzes', href: '/teacher/quizzes', icon: Brain },
      { text: 'Assignments', href: '/teacher/assignments', icon: ClipboardList },
    ]
  },
  {
    heading: 'Management',
    links: [
      { text: 'MCQ Manager', href: '/teacher/mcq-manager', icon: FileText },
      { text: 'Announcements', href: '/teacher/announcements', icon: Bell },
    ]
  }
];

// Admin dropdown data
const adminDropdownData: DropdownData = [
  {
    heading: 'Platform',
    links: [
      { text: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
      { text: 'Boards', href: '/admin/boards', icon: Award },
      { text: 'Subjects', href: '/admin/subjects', icon: BookOpen },
      { text: 'Resources', href: '/admin/resources', icon: FileText },
    ]
  },
  {
    heading: 'Management',
    links: [
      { text: 'Users', href: '/admin/users', icon: Users },
      { text: 'Moderation', href: '/admin/moderation', icon: ClipboardList },
      { text: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
      { text: 'Feedback', href: '/admin/feedback', icon: Bell },
    ]
  },
  {
    heading: 'System',
    links: [
      { text: 'Settings', href: '/admin/settings', icon: Settings },
    ]
  }
];

export const AnimatedNavbar: React.FC = () => {
  const [activeMenuItemIndex, setActiveMenuItemIndex] = useState<number | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [animationDirection, setAnimationDirection] = useState<AnimationDirection>('right-to-left');
  const closeTimeoutRef = useRef<number | null>(null);
  const prevActiveMenuItemIndex = useRef<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [mobileActiveDropdownIndex, setMobileActiveDropdownIndex] = useState<number | null>(null);
  const [activeBoardKey, setActiveBoardKey] = useState<string | null>(null);
  const [boardQualsByKey, setBoardQualsByKey] = useState<Record<string, any[]>>({});
  const [boardSubjectsByQualId, setBoardSubjectsByQualId] = useState<Record<string, any[]>>({});
  const [activeQualId, setActiveQualId] = useState<string | null>(null);
  const [isBoardLoading, setIsBoardLoading] = useState(false);
  const [isSubjectsLoading, setIsSubjectsLoading] = useState(false);

  const [location, setLocation] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isTutorModalOpen, setIsTutorModalOpen] = useState(false);

  // Build menu items based on auth state and role
  const getMenuItems = (): MenuItem[] => {
    const items: MenuItem[] = [
      { label: 'Home', href: '/' },
      { label: 'CAIE', href: '/curriculum/caie', boardKey: 'caie' },
      { label: 'IB', href: '/curriculum/ib', boardKey: 'ib' },
      { label: 'Edexcel', href: '/curriculum/edexcel', boardKey: 'pearson' },
      { label: 'Subjects', href: '/subjects', dropdownData: subjectsDropdownData },
      { label: 'Notes', href: '/subjects', dropdownData: notesDropdownData },
      { label: 'Videos', href: '/subjects' },
      { label: 'Past Papers', href: '/subjects' },
    ];

    if (isAuthenticated && user) {
      if (user.role === 'student') {
        items.push({ label: 'Student', href: '/student/dashboard', dropdownData: studentDropdownData });
      }
      if (user.role === 'teacher') {
        items.push({ label: 'Teacher', href: '/teacher/dashboard', dropdownData: teacherDropdownData });
      }
      if (user.role === 'admin') {
        items.push({ label: 'Admin', href: '/admin/dashboard', dropdownData: adminDropdownData });
      }
    }

    return items;
  };

  const menuItems = getMenuItems();

  const activeItem = activeMenuItemIndex !== null ? menuItems[activeMenuItemIndex] : null;

  const activeBoardQuals = useMemo(() => {
    if (!activeBoardKey) return [];
    return boardQualsByKey[activeBoardKey] ?? [];
  }, [activeBoardKey, boardQualsByKey]);

  const activeSubjects = useMemo(() => {
    if (!activeQualId) return [];
    return boardSubjectsByQualId[activeQualId] ?? [];
  }, [activeQualId, boardSubjectsByQualId]);

  const loadBoardQuals = async (boardKey: string) => {
    if (boardQualsByKey[boardKey]) return;
    setIsBoardLoading(true);
    try {
      const res = await fetch(`/api/curriculum/boards/${boardKey}/qualifications`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load qualifications');
      const quals = await res.json();
      setBoardQualsByKey((prev) => ({ ...prev, [boardKey]: quals }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsBoardLoading(false);
    }
  };

  const loadSubjects = async (qualId: string) => {
    if (boardSubjectsByQualId[qualId]) return;
    setIsSubjectsLoading(true);
    try {
      const res = await fetch(`/api/curriculum/qualifications/${qualId}/subjects`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load subjects');
      const subjects = await res.json();
      setBoardSubjectsByQualId((prev) => ({ ...prev, [qualId]: subjects }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubjectsLoading(false);
    }
  };

  useEffect(() => {
    if (activeMenuItemIndex !== null && prevActiveMenuItemIndex.current !== null) {
      if (activeMenuItemIndex > prevActiveMenuItemIndex.current) {
        setAnimationDirection('right-to-left');
      } else {
        setAnimationDirection('left-to-right');
      }
    } else {
      setAnimationDirection('right-to-left');
    }
    prevActiveMenuItemIndex.current = activeMenuItemIndex;
  }, [activeMenuItemIndex]);

  const openDropdown = (index: number) => {
    if (closeTimeoutRef.current !== null) {
      clearTimeout(closeTimeoutRef.current);
    }
    setActiveMenuItemIndex(index);
    setIsDropdownOpen(true);

    const item = menuItems[index];
    if (item?.boardKey) {
      setActiveBoardKey(item.boardKey);
      void loadBoardQuals(item.boardKey);
    } else {
      setActiveBoardKey(null);
      setActiveQualId(null);
    }
  };

  const closeDropdown = () => {
    closeTimeoutRef.current = window.setTimeout(() => {
      setIsDropdownOpen(false);
    }, 100);
  };

  const handleDropdownTransitionEnd = () => {
    if (!isDropdownOpen) {
      setActiveMenuItemIndex(null);
      prevActiveMenuItemIndex.current = null;
    }
  };

  const toggleMobileMenu = () => {
    const newState = !isMobileMenuOpen;
    setIsMobileMenuOpen(newState);
    if (!newState) {
      setMobileActiveDropdownIndex(null);
    }
  };

  const toggleMobileDropdown = (index: number) => {
    const isOpening = mobileActiveDropdownIndex !== index;
    setMobileActiveDropdownIndex(isOpening ? index : null);

    if (isOpening) {
      const item = menuItems[index];
      if (item?.boardKey) {
        setActiveBoardKey(item.boardKey);
        void loadBoardQuals(item.boardKey);
      }
    }
  };

  const handleMobileLinkClick = () => {
    setIsMobileMenuOpen(false);
    setMobileActiveDropdownIndex(null);
  };

  const handleLogout = async () => {
    await logout();
    setLocation('/');
    handleMobileLinkClick();
  };

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const contentVariants: { [key in AnimationDirection]: Variants } = {
    'right-to-left': {
      initial: { opacity: 0, x: 100 },
      animate: {
        opacity: 1,
        x: 0,
        transition: {
          opacity: { duration: 0.2 },
          x: { duration: 0.3, ease: 'easeOut' }
        }
      },
      exit: {
        opacity: 0,
        x: -100,
        transition: {
          opacity: { duration: 0.2 },
          x: { duration: 0.3, ease: 'easeIn' }
        }
      },
    },
    'left-to-right': {
      initial: { opacity: 0, x: -100 },
      animate: {
        opacity: 1,
        x: 0,
        transition: {
          opacity: { duration: 0.2 },
          x: { duration: 0.3, ease: 'easeOut' }
        }
      },
      exit: {
        opacity: 0,
        x: 100,
        transition: {
          opacity: { duration: 0.2 },
          x: { duration: 0.3, ease: 'easeIn' }
        }
      },
    }
  };

  const containerVariants: Variants = {
    closed: { opacity: 0, pointerEvents: 'none' as const },
    open: { opacity: 1, pointerEvents: 'auto' as const },
  };

  const mobileMenuVariants: Variants = {
    closed: { x: '100%' },
    open: { x: '0%' },
  };

  const mobileDropdownVariants: Variants = {
    closed: { height: 0, opacity: 0 },
    open: { height: 'auto', opacity: 1 },
  };

  return (
    <>
      <motion.nav
        className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <div className="flex items-center justify-between h-16 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <GraduationCap className="h-7 w-7 text-primary" />
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                ExamsValley
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <ul
            className="hidden md:flex gap-0.5 mx-3 list-none p-0 m-0 h-full items-center"
            onMouseLeave={closeDropdown}
          >
            {menuItems.map((item, index) => (
              <li
                key={`desktop-menu-${index}`}
                className={cn(
                  "flex items-center h-full relative text-foreground",
                  activeMenuItemIndex === index && isDropdownOpen && "text-primary"
                )}
                onMouseEnter={() => (item.dropdownData || item.boardKey) ? openDropdown(index) : undefined}
              >
                <Link href={item.href}>
                  <span className={cn(
                    "px-3 py-2 text-sm font-medium transition-colors cursor-pointer rounded-md",
                    "hover:text-primary hover:bg-accent",
                    location === item.href || location.startsWith(item.href + '/')
                      ? "text-primary bg-accent"
                      : "text-foreground/80"
                  )}>
                    {item.label}
                  </span>
                </Link>

                {/* Animated underline */}
                {activeMenuItemIndex === index && isDropdownOpen && item.dropdownData && (
                  <motion.div
                    layoutId="navbar-underline"
                    className="absolute -bottom-[1px] left-4 right-4 h-0.5 bg-primary rounded-full"
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    exit={{ opacity: 0, scaleX: 0 }}
                    transition={{ duration: 0.2 }}
                  />
                )}
              </li>
            ))}
          </ul>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="secondary" asChild>
              <Link href="/become-a-tutor">Tutor</Link>
            </Button>
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <Link href="/student/profile">
                  <div className="flex items-center gap-2 cursor-pointer hover:bg-accent rounded-full pr-3 pl-1 py-1 transition-colors text-foreground">
                    <Avatar className="h-8 w-8 border-2 border-primary/20">
                      {user?.avatar && <AvatarImage src={user.avatar} alt={user?.name} />}
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium hidden lg:block">{user.name}</span>
                  </div>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Get Started</Link>
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-muted-foreground hover:text-foreground"
            >
              {theme === "light" ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="md:hidden flex items-center h-10">
            <StaggeredMenu
              items={menuItems.map(item => ({
                label: item.label,
                link: item.href,
                ariaLabel: item.label,
                onClick: item.label === "Become a Tutor" ? () => setIsTutorModalOpen(true) : undefined
              }))}
              position="right"
              logoUrl={null}
              accentColor="var(--primary)"
              colors={['#0f172a', '#1e293b', '#334155']}
              isFixed={true}
              menuButtonColor="var(--foreground)"
              openMenuButtonColor="var(--foreground)"
              className="navbar-staggered-menu"
            />
          </div>
        </div>

        {/* Desktop Mega Dropdown */}
        <AnimatePresence>
          {isDropdownOpen && activeMenuItemIndex !== null && (menuItems[activeMenuItemIndex]?.dropdownData || menuItems[activeMenuItemIndex]?.boardKey) && (
            <motion.div
              key="desktop-dropdown-container"
              className="hidden md:block absolute top-[65px] left-0 right-0 bg-background border-b shadow-lg"
              initial="closed"
              animate="open"
              exit="closed"
              variants={containerVariants}
              transition={{ duration: 0.3 }}
              onMouseEnter={() => { if (closeTimeoutRef.current !== null) clearTimeout(closeTimeoutRef.current); }}
              onMouseLeave={closeDropdown}
              onAnimationComplete={handleDropdownTransitionEnd}
            >
              <AnimatePresence mode="wait">
                {activeItem?.boardKey ? (
                  <motion.div
                    key={`desktop-board-dropdown-${activeItem.boardKey}`}
                    variants={contentVariants[animationDirection]}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="max-w-7xl mx-auto p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <Link href={activeItem.href}>
                        <span className="inline-flex items-center gap-2 text-lg font-semibold text-primary hover:text-primary/80 cursor-pointer transition-colors">
                          Explore {activeItem.label}
                          <ChevronRight className="h-4 w-4" />
                        </span>
                      </Link>
                    </div>

                    <div className="grid grid-cols-12 gap-6">
                      <div className="col-span-5">
                        <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Qualifications</h3>
                        <div className="rounded-lg border bg-card">
                          <div className="max-h-[360px] overflow-auto p-2">
                            {isBoardLoading && activeBoardQuals.length === 0 ? (
                              <div className="p-3 text-sm text-muted-foreground">Loading...</div>
                            ) : (
                              <ul className="list-none p-0 m-0 space-y-1">
                                {activeBoardQuals.map((q: any) => (
                                  <li key={q.id}>
                                    <button
                                      type="button"
                                      onMouseEnter={() => {
                                        setActiveQualId(q.id);
                                        void loadSubjects(q.id);
                                      }}
                                      onFocus={() => {
                                        setActiveQualId(q.id);
                                        void loadSubjects(q.id);
                                      }}
                                      className={cn(
                                        "w-full text-left rounded-md px-3 py-2 text-sm transition-colors",
                                        "hover:bg-accent hover:text-primary",
                                        activeQualId === q.id ? "bg-accent text-primary" : "text-foreground"
                                      )}
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="font-medium">{q.displayName}</span>
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                      </div>
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="col-span-7">
                        <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Subjects</h3>
                        <div className="rounded-lg border bg-card">
                          <div className="max-h-[360px] overflow-auto p-3">
                            {!activeQualId ? (
                              <div className="text-sm text-muted-foreground">Hover a qualification to see subjects.</div>
                            ) : isSubjectsLoading && activeSubjects.length === 0 ? (
                              <div className="text-sm text-muted-foreground">Loading...</div>
                            ) : activeSubjects.length === 0 ? (
                              <div className="text-sm text-muted-foreground">No subjects found.</div>
                            ) : (
                              <div className="grid grid-cols-2 gap-2">
                                {activeSubjects.map((s: any) => (
                                  <Link key={s.id} href={`/subject/${s.slug}`}>
                                    <span className="block rounded-md border bg-background px-3 py-2 text-sm hover:bg-accent hover:text-primary transition-colors cursor-pointer">
                                      <div className="font-medium truncate text-foreground">{s.subjectName}</div>
                                      {s.subjectCode ? (
                                        <div className="text-xs text-muted-foreground truncate">{s.subjectCode}</div>
                                      ) : null}
                                    </span>
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  activeItem?.dropdownData && (
                    <motion.div
                      key={`desktop-dropdown-content-${activeMenuItemIndex}`}
                      variants={contentVariants[animationDirection]}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="max-w-7xl mx-auto p-6"
                    >
                      <Link href={menuItems[activeMenuItemIndex]?.href || '#'}>
                        <span className="inline-flex items-center gap-2 mb-4 text-lg font-semibold text-primary hover:text-primary/80 cursor-pointer transition-colors">
                          Explore {menuItems[activeMenuItemIndex]?.label}
                          <ChevronRight className="h-4 w-4" />
                        </span>
                      </Link>

                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {menuItems[activeMenuItemIndex]?.dropdownData?.map((column, colIndex) => (
                          <div key={`desktop-col-${colIndex}`}>
                            <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                              {column.heading}
                            </h3>
                            <ul className="list-none p-0 m-0 space-y-1 text-foreground">
                              {column.links.map((link, linkIndex) => (
                                <li key={`desktop-link-${colIndex}-${linkIndex}`}>
                                  <Link href={link.href}>
                                    <span className="flex items-center gap-2 py-1.5 text-sm hover:text-primary cursor-pointer transition-colors rounded-md px-2 -mx-2 hover:bg-accent">
                                      {link.icon && <link.icon className="h-4 w-4 text-muted-foreground" />}
                                      {link.text}
                                    </span>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Mobile Menu Overlay - Handled by StaggeredMenu now */}

      <TutorRegistrationModal
        isOpen={isTutorModalOpen}
        onClose={() => setIsTutorModalOpen(false)}
      />
    </>
  );
};
