type WeatherCardProps = {
  location: string;
  temperature: number;
  weather: string;
  unit?: string;
};

export function WeatherCard({
  location,
  temperature,
  weather,
  unit = "F",
}: WeatherCardProps) {
  return (
    <div className="flex w-full max-w-xs flex-col gap-1 rounded-lg border bg-muted/40 px-3 py-2">
      <p className="text-[0.625rem] font-medium tracking-wide text-muted-foreground uppercase">
        Weather
      </p>
      <p className="font-heading text-sm font-semibold">{location}</p>
      <p className="text-2xl font-semibold tabular-nums">
        {temperature}°{unit}
      </p>
      <p className="text-xs text-muted-foreground">{weather}</p>
    </div>
  );
}
