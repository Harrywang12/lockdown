import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  TooltipProps
} from 'recharts';
import { cn } from '../../../utils/cn';

interface SecurityScoreChartProps {
  data: Array<{
    date: string;
    score: number;
    vulnerabilities?: number;
  }>;
  height?: number;
  className?: string;
  darkMode?: boolean;
}

const SecurityScoreChart: React.FC<SecurityScoreChartProps> = ({
  data,
  height = 300,
  className,
  darkMode
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  // Format date for x-axis
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };
  
  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const score = payload[0].value;
      const scoreColor = 
        score >= 80 ? 'text-security-safe' :
        score >= 60 ? 'text-security-low' :
        score >= 40 ? 'text-security-medium' :
        score >= 20 ? 'text-security-high' :
        'text-security-critical';
      
      return (
        <div className="bg-white dark:bg-dark-card p-3 border border-slate-200 dark:border-dark-border rounded-lg shadow-lg">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            {formatDate(label)}
          </p>
          <p className={cn("text-lg font-bold", scoreColor)}>
            Score: {score}
          </p>
          {payload[0].payload.vulnerabilities !== undefined && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Vulnerabilities: {payload[0].payload.vulnerabilities}
            </p>
          )}
        </div>
      );
    }
    
    return null;
  };
  
  // Get gradient colors based on average score
  const getGradientColors = () => {
    const avgScore = data.reduce((sum, item) => sum + item.score, 0) / data.length;
    
    if (avgScore >= 80) return { start: '#09b876', end: '#09b87620', stroke: '#09b876' };
    if (avgScore >= 60) return { start: '#2ab05d', end: '#2ab05d20', stroke: '#2ab05d' };
    if (avgScore >= 40) return { start: '#f5a524', end: '#f5a52420', stroke: '#f5a524' };
    if (avgScore >= 20) return { start: '#f46e37', end: '#f46e3720', stroke: '#f46e37' };
    return { start: '#ee2d4e', end: '#ee2d4e20', stroke: '#ee2d4e' };
  };
  
  const gradientColors = getGradientColors();
  
  // Animation variants for dots
  const dotVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    hover: { scale: 1.5, opacity: 1 }
  };
  
  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          onMouseMove={(e) => {
            if (e.activeTooltipIndex !== undefined) {
              setHoveredIndex(e.activeTooltipIndex);
            }
          }}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <defs>
            <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={gradientColors.start} stopOpacity={0.3} />
              <stop offset="95%" stopColor={gradientColors.end} stopOpacity={0} />
            </linearGradient>
          </defs>
          
          <CartesianGrid 
            strokeDasharray="3 3" 
            vertical={false} 
            stroke={darkMode ? "rgba(148, 163, 184, 0.1)" : "rgba(203, 213, 225, 0.5)"} 
          />
          
          <XAxis 
            dataKey="date" 
            tickFormatter={formatDate} 
            tick={{ fill: darkMode ? "#94a3b8" : "#64748b", fontSize: 12 }}
            axisLine={{ stroke: darkMode ? "rgba(148, 163, 184, 0.2)" : "rgba(203, 213, 225, 0.8)" }}
            tickLine={false}
          />
          
          <YAxis 
            domain={[0, 100]} 
            tick={{ fill: darkMode ? "#94a3b8" : "#64748b", fontSize: 12 }}
            axisLine={{ stroke: darkMode ? "rgba(148, 163, 184, 0.2)" : "rgba(203, 213, 225, 0.8)" }}
            tickLine={false}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          <Area
            type="monotone"
            dataKey="score"
            stroke={gradientColors.stroke}
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#scoreGradient)"
            animationDuration={1500}
            activeDot={({ cx, cy, index }) => (
              <motion.circle
                cx={cx}
                cy={cy}
                r={5}
                fill={gradientColors.stroke}
                stroke="#fff"
                strokeWidth={2}
                variants={dotVariants}
                initial="initial"
                animate={hoveredIndex === index ? "hover" : "animate"}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
              />
            )}
            dot={({ cx, cy, index }) => (
              <motion.circle
                cx={cx}
                cy={cy}
                r={3}
                fill={gradientColors.stroke}
                stroke="#fff"
                strokeWidth={1.5}
                variants={dotVariants}
                initial="initial"
                animate="animate"
                transition={{ delay: index * 0.05 }}
              />
            )}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SecurityScoreChart;
