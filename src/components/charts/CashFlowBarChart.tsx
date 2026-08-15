// ROKDA NATIVE SVG CASH FLOW BAR CHART

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import { formatPaiseCompact } from '../../utils/currency';

interface CashFlowBarData {
  periodLabel: string;
  incomePaise: number;
  expensePaise: number;
}

interface CashFlowBarChartProps {
  data: CashFlowBarData[];
  height?: number;
}

export const CashFlowBarChart: React.FC<CashFlowBarChartProps> = ({ data, height = 180 }) => {
  const { colors } = useTheme();

  if (data.length === 0) {
    return (
      <View style={[styles.emptyContainer, { height }]}>
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>No cash flow data available</Text>
      </View>
    );
  }

  const maxVal = Math.max(1, ...data.map(d => Math.max(d.incomePaise, d.expensePaise)));
  const svgHeight = height - 40;
  const paddingLeft = 40;
  const chartWidth = 300;
  const groupWidth = chartWidth / data.length;
  const barWidth = Math.min(14, groupWidth * 0.35);

  return (
    <View style={styles.container}>
      <Svg width="100%" height={height} viewBox={`0 0 ${chartWidth + paddingLeft} ${height}`}>
        {/* Y-Axis Reference Line */}
        <Line x1={paddingLeft} y1={svgHeight} x2={chartWidth + paddingLeft} y2={svgHeight} stroke={colors.cardBorder} strokeWidth="1" />

        {/* Max value label */}
        <SvgText x={paddingLeft - 6} y={12} fill={colors.textMuted} fontSize="10" textAnchor="end">
          {formatPaiseCompact(maxVal)}
        </SvgText>

        {data.map((item, i) => {
          const groupX = paddingLeft + i * groupWidth + groupWidth / 2;
          const incomeHeight = (item.incomePaise / maxVal) * (svgHeight - 20);
          const expenseHeight = (item.expensePaise / maxVal) * (svgHeight - 20);

          return (
            <React.Fragment key={i}>
              {/* Income Bar */}
              <Rect
                x={groupX - barWidth - 2}
                y={svgHeight - incomeHeight}
                width={barWidth}
                height={Math.max(2, incomeHeight)}
                fill="#10B981"
                rx={3}
              />
              {/* Expense Bar */}
              <Rect
                x={groupX + 2}
                y={svgHeight - expenseHeight}
                width={barWidth}
                height={Math.max(2, expenseHeight)}
                fill="#EF4444"
                rx={3}
              />
              {/* Period Label */}
              <SvgText x={groupX} y={svgHeight + 16} fill={colors.textSecondary} fontSize="10" textAnchor="middle">
                {item.periodLabel}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>

      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>Income</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>Expenses</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
