import React from 'react';

declare module "@/components/StaggeredMenu" {
    export interface StaggeredMenuItem {
        label: string;
        link?: string;
        ariaLabel?: string;
        onClick?: () => void;
    }

    export interface StaggeredMenuProps {
        position?: 'left' | 'right';
        colors?: string[];
        items?: StaggeredMenuItem[];
        socialItems?: { label: string; link: string }[];
        displaySocials?: boolean;
        displayItemNumbering?: boolean;
        className?: string;
        logoUrl?: string;
        menuButtonColor?: string;
        openMenuButtonColor?: string;
        accentColor?: string;
        changeMenuColorOnOpen?: boolean;
        isFixed?: boolean;
        closeOnClickAway?: boolean;
        onMenuOpen?: () => void;
        onMenuClose?: () => void;
    }

    export const StaggeredMenu: React.FC<StaggeredMenuProps>;
    export default StaggeredMenu;
}
