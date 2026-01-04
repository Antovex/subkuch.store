import * as React from "react";

interface ProfileIconProps {
    width?: number;
    height?: number;
    className?: string;
    color?: string;
}

const ProfileIcon: React.FC<ProfileIconProps> = ({ 
    width = 24, 
    height = 24, 
    className = "",
    color = "#000000", 
}) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={width} 
        height={height} 
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <circle cx="12" cy="8" r="4" />
        <path d="M20 21c0-2.761-3.582-5-8-5s-8 2.239-8 5" />
    </svg>
);

export default ProfileIcon;
