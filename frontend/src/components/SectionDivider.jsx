import { useTheme } from '../contexts/ThemeContext';

export default function SectionDivider() {
  const { isDarkMode } = useTheme();

  return (
    <div className="w-full px-4">
      <div 
        className={`h-px w-full max-w-7xl mx-auto ${
          isDarkMode ? 'bg-gradient-to-r from-transparent via-gray-700 to-transparent' 
          : 'bg-gradient-to-r from-transparent via-gray-200 to-transparent'
        }`}
      />
    </div>
  );
}
