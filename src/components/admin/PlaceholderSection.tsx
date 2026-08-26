export function PlaceholderSection({ icon, title, note }: { icon: string; title: string; note: string }) {
  return (
    <div>
      <div className="mb-5 text-lg font-extrabold text-[#0F172A]">
        {icon} {title}
      </div>
      <p className="text-sm text-[#64748B]">{note}</p>
    </div>
  );
}
