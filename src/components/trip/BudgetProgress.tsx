import React from 'react';

interface CategoryBudget {
  category: string;
  allocated: number;
  spent: number;
  color: string;
}

interface BudgetProgressProps {
  totalBudget: number;
  categories: CategoryBudget[];
  spentSoFar?: number;
  compact?: boolean;
}

export const BudgetProgress = ({ totalBudget, categories, spentSoFar, compact }: BudgetProgressProps) => {
  const totalSpent = typeof spentSoFar === 'number' ? spentSoFar : categories.reduce((acc, curr) => acc + curr.spent, 0);
  const percentageTotal = Math.min((totalSpent / totalBudget) * 100, 100);
  
  const isOver = totalSpent > totalBudget;
  const isNearLimit = percentageTotal > 85 && percentageTotal <= 100;

  let statusColor = 'text-success-green';
  let barColor = '#10B981'; // success green

  if (isOver) {
    statusColor = 'text-error-red';
    barColor = '#EF4444'; // error red
  } else if (isNearLimit) {
    statusColor = 'text-warning-orange';
    barColor = '#F97316'; // warning orange
  }

  return (
    <div className={`bg-surface-card rounded-[16px] ${compact ? 'p-3' : 'p-5'}`}>
      <div className={`flex justify-between items-end ${compact ? 'mb-2' : 'mb-4'}`}>
        <div>
          <p className={`text-sm text-text-secondary font-medium ${compact ? 'mb-0' : 'mb-1'}`}>Total Budget</p>
          <h3 className={`font-semibold text-foreground tracking-tight ${compact ? 'text-lg' : 'text-2xl'}`}>
            ${totalBudget.toLocaleString()}
          </h3>
        </div>
        <div className="text-right">
          <span className={`text-sm font-medium ${statusColor}`}>
            ${totalSpent.toLocaleString()} / ${totalBudget.toLocaleString()} {typeof spentSoFar === 'number' ? 'spent so far' : 'spent'}
          </span>
        </div>
      </div>

      {/* Main Bar */}
      <div className={`${compact ? 'mt-2' : ''}`}>
        <div className={`h-[7px] w-full bg-surface-hover rounded-full overflow-hidden ${compact ? 'mb-3' : 'mb-6'}`}>
          <div
            className="h-full transition-all duration-500 rounded-full"
            style={{ width: `${percentageTotal}%`, backgroundColor: barColor }}
          />
        </div>
      </div>

      {!compact && (
        <div className="space-y-3">
          {categories.map((cat) => {
            const percentOfCat = Math.min((cat.spent / cat.allocated) * 100, 100);
            return (
              <div key={cat.category} className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-sm">
                  <span className="flex items-center gap-2 text-foreground font-medium">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    {cat.category}
                  </span>
                  <span className="font-mono text-text-secondary">
                    ${cat.spent} <span className="text-text-tertiary">/ ${cat.allocated}</span>
                  </span>
                </div>
                <div className="h-1.5 w-full bg-surface-hover rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all duration-300 rounded-full"
                    style={{ width: `${percentOfCat}%`, backgroundColor: cat.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
