import { Fragment } from "react";

const INLINE_PATTERN = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|\[[^\]\n]+\]\((?:https?:\/\/|\/)[^)\s]+\))/g;

export function ArticleInline({ text }: { text: string }) {
  return text.split(INLINE_PATTERN).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-bold text-[#0F172A]">
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }

    const link = part.match(/^\[([^\]]+)\]\(((?:https?:\/\/|\/)[^)\s]+)\)$/);
    if (link) {
      const external = link[2].startsWith("http");

      return (
        <a
          key={index}
          href={link[2]}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
          className="font-semibold text-[#D83F6A] underline decoration-[#E8547A]/35 underline-offset-2 hover:text-[#B92F59]"
        >
          {link[1]}
        </a>
      );
    }

    return <Fragment key={index}>{part}</Fragment>;
  });
}
