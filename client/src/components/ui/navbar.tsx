import { Link, useLocation } from 'wouter'
import { Equal, X, Sun, Moon, GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import React from 'react'
import { cn } from '@/lib/utils'
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

export const Header = () => {
    const [menuState, setMenuState] = React.useState(false)
    const [isScrolled, setIsScrolled] = React.useState(false)
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [location, setLocation] = useLocation();

    const menuItems = user
        ? [
            { name: 'Features', href: '/#features' },
            { name: 'Study Materials', href: '/student/materials' },
            { name: 'Practice', href: '/student/practice' },
        ]
        : [{ name: 'Features', href: '/#features' }];

    const exploreLinks = [
        {
            title: "Curriculum",
            href: "/curriculum",
            description: "Browse boards, qualifications, and subjects",
        },
        {
            title: "Subjects",
            href: "/subjects",
            description: "Search across all available subjects",
        },
        {
            title: "Help",
            href: "/help",
            description: "Guides and FAQs",
        },
    ];

    React.useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const handleLogout = async () => {
        await logout();
        setLocation('/'); // Redirect to home page after logout
    };

    return (
        <header>
            <nav
                data-state={menuState && 'active'}
                className="fixed left-0 w-full z-50 px-2">
                <div className={cn('mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12', isScrolled && 'bg-background/80 max-w-4xl rounded-2xl border backdrop-blur-lg lg:px-5')}>
                    <div className="relative flex flex-wrap items-center justify-between gap-6 lg:gap-0 py-2">
                        <div className="flex w-full justify-between lg:w-auto">
                            <Link href="/">
                                <div className="flex gap-2 items-center cursor-pointer">
                                    <GraduationCap className="h-6 w-6 text-primary" />
                                    <p className='font-semibold text-xl tracking-tighter'>Upriser</p>
                                </div>
                            </Link>

                            <div className="flex items-center gap-2 lg:hidden">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={toggleTheme}
                                    className="mr-2"
                                >
                                    {theme === "light" ? (
                                        <Moon className="h-4 w-4" />
                                    ) : (
                                        <Sun className="h-4 w-4" />
                                    )}
                                </Button>
                                <button
                                    onClick={() => setMenuState(!menuState)}
                                    aria-label={menuState == true ? 'Close Menu' : 'Open Menu'}
                                    data-state={menuState ? 'active' : 'inactive'}
                                    className="relative z-20 block cursor-pointer p-2.5">
                                    <Equal className="data-[state=active]:rotate-180 data-[state=active]:scale-0 data-[state=active]:opacity-0 m-auto size-6 duration-200" data-state={menuState ? 'active' : 'inactive'} />
                                    <X className="data-[state=active]:rotate-0 data-[state=active]:scale-100 data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" data-state={menuState ? 'active' : 'inactive'} />
                                </button>
                            </div>
                        </div>

                        <div className="absolute inset-0 m-auto hidden size-fit lg:block">
                            <NavigationMenu>
                                <NavigationMenuList className="space-x-2">
                                    <NavigationMenuItem>
                                        <NavigationMenuTrigger className="bg-transparent hover:bg-accent/60 data-[state=open]:bg-accent/60">
                                            Explore
                                        </NavigationMenuTrigger>
                                        <NavigationMenuContent>
                                            <div className="w-[520px] p-4">
                                                <div className="grid gap-3 md:grid-cols-2">
                                                    {exploreLinks.map((item) => (
                                                        <NavigationMenuLink asChild key={item.href}>
                                                            <Link
                                                                href={item.href}
                                                                className={cn(
                                                                    "block rounded-lg border bg-card p-4 transition-colors",
                                                                    "hover:bg-accent/60 hover:text-accent-foreground",
                                                                    "focus:bg-accent/60 focus:text-accent-foreground focus:outline-none"
                                                                )}
                                                            >
                                                                <div className="text-sm font-medium leading-none">{item.title}</div>
                                                                <p className="mt-1 text-sm text-muted-foreground">
                                                                    {item.description}
                                                                </p>
                                                            </Link>
                                                        </NavigationMenuLink>
                                                    ))}
                                                </div>
                                            </div>
                                        </NavigationMenuContent>
                                    </NavigationMenuItem>

                                    {menuItems.map((item) => (
                                        <NavigationMenuItem key={item.href}>
                                            <NavigationMenuLink asChild>
                                                <Link
                                                    href={item.href}
                                                    className={cn(
                                                        navigationMenuTriggerStyle(),
                                                        "bg-transparent",
                                                        "hover:bg-accent/60",
                                                        "data-[active]:bg-accent/60"
                                                    )}
                                                >
                                                    {item.name}
                                                </Link>
                                            </NavigationMenuLink>
                                        </NavigationMenuItem>
                                    ))}
                                </NavigationMenuList>
                            </NavigationMenu>
                        </div>


                        <div
                            data-state={menuState ? 'active' : 'inactive'}
                            className="bg-background data-[state=active]:block lg:data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent">
                            <div className="lg:hidden">
                                <ul className="space-y-6 text-base">
                                    {menuItems.map((item, index) => (
                                        <li key={index}>
                                            <Link href={item.href}>
                                                <span className="text-muted-foreground hover:text-primary block duration-150 cursor-pointer">{item.name}</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-2 sm:space-y-0 md:w-fit items-center">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={toggleTheme}
                                    className="hidden lg:flex"
                                >
                                    {theme === "light" ? (
                                        <Moon className="h-4 w-4" />
                                    ) : (
                                        <Sun className="h-4 w-4" />
                                    )}
                                </Button>

                                {user ? (
                                    <>
                                        <Link href={`/${user.role}/dashboard`}>
                                            <Button size="sm" className="w-full sm:w-auto">Dashboard</Button>
                                        </Link>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleLogout}
                                            className="w-full sm:w-auto"
                                        >
                                            Logout
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Link href="/login">
                                            <Button variant="outline" size="sm" className="w-full sm:w-auto">Login</Button>
                                        </Link>
                                        <Link href="/register">
                                            <Button size="sm" className="w-full sm:w-auto">Sign Up</Button>
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    )
}