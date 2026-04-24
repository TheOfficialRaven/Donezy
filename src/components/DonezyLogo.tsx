interface DonezyLogoProps {
  className?: string;
}

export default function DonezyLogo({ className = 'h-8 w-auto' }: DonezyLogoProps) {
  return (
    <img
      src="/Donezy_logo_full.png"
      alt="Donezy"
      className={className}
    />
  );
}
