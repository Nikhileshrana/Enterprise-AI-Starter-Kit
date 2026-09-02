type StockCardProps = {
  symbol: string;
  price: number;
  change: number;
};

export function StockCard({ symbol, price, change }: StockCardProps) {
  const up = change >= 0;
  return (
    <div className="flex w-full max-w-xs flex-col gap-1 rounded-lg border bg-muted/40 px-3 py-2">
      <p className="text-[0.625rem] font-medium tracking-wide text-muted-foreground uppercase">
        Stock
      </p>
      <p className="font-heading text-sm font-semibold">{symbol}</p>
      <p className="text-2xl font-semibold tabular-nums">
        ${price.toFixed(2)}
      </p>
      <p
        className={
          up ? "text-xs text-emerald-700 dark:text-emerald-400" : "text-xs text-destructive"
        }
      >
        {up ? "+" : ""}
        {change.toFixed(2)}
      </p>
    </div>
  );
}
