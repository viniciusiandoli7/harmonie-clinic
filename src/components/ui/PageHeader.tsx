export default function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex items-center justify-between">
      <div>
        <p className="text-[11px] tracking-[0.3em] text-[#C8A35F] uppercase">
          Harmonie Management System
        </p>

        <h1 className="text-4xl mt-2">{title}</h1>

        {subtitle && (
          <p className="text-gray-500 mt-2">{subtitle}</p>
        )}
      </div>

      {action}
    </div>
  );
}