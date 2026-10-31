import Image from "next/image";

type Props = {
  icon: string;
  description: string;
  size?: number;
};

export default function WeatherIcon({ icon, description, size = 64 }: Props) {
  return (
    <Image
      src={`https://openweathermap.org/img/wn/${icon}@2x.png`}
      alt={description}
      width={size}
      height={size}
      className="drop-shadow-sm"
      unoptimized
    />
  );
}
