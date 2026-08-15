// ROKDA NATIVE SVG CATEGORY DONUT CHART

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { G, Path, Circle } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import { formatPaise } from '../../utils/currency';

interface DonutSlice {
  label: string;
  amountPaise: number;
  color: string;
}

interface DonutChartProps {
  slices: DonutSlice[];
  totalPaise: number;
  size?: number;
}

export const DonutChart: React.FC<DonutChartProps> = ({ slices, totalPaise, size = 180 }) => {
  const { colors } = useTheme();

  if (slices.length === 0 || totalPaise === 0) {
    return (
      <View style={[styles.emptyContainer, { height: size }]}>
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>No spending data for period</Text>
      </View>
    );
  }

  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedAngle = 0;

  return (
    <View style={styles.container}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <G rotation="-90" origin={`${center}, ${center}`}>
            {slices.map((slice, i) => {
              const strokeDashoffset = circumference - (slice.amountPaise / totalPaise) * circumference;
              const angle = (slice.amountPaise / totalPaise) * 360;
              const currentAngle = accumulatedAngle;
              accumulatedAngle += angle;

              return (
                <Circle
                  key={i}
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke={slice.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${circumference} ${circumference}`}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  origin={`${center}, ${center}`}
                  rotation={currentAngle}
                  fill="transparent"
                />
              );
            })}
          </G>
        </Svg>
        <View style={styles.centerLabel}>
          <Text style={[styles.totalTitle, { color: colors.textMuted }]}>Total Spent</Text>
          <Text style={[styles.totalAmount, { color: colors.textPrimary }]}>{formatPaise(totalPaise)}</Text>
        </View>
      </View>

      {/* Legend Grid */}
      <View style={styles.legendContainer}>
        {slices.slice(0, 5).map((slice, i) => (
          <View key={i} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: slice.color }]} />
            <Text style={[styles.legendLabel, { color: colors.textSecondary }]} numberOfLines={1}>
              {slice.label}
            </Text>
            <Text style={[styles.legendAmount, { color: colors.textPrimary }]}>
              {formatPaise(slice.amountPaise)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 12,
  },
  centerLabel: {
    position: 'absolute',
    alignItems: 'center',
  },
  totalTitle: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
  legendContainer: {
    width: '100%',
    marginTop: 16,
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  legendAmount: {
    fontSize: 13,
    fontWeight: '600',
  },
});
