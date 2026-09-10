import { ArticleInline } from "@/components/articles/ArticleInline";
import { parseArticleContent } from "@/lib/articles/content";

interface ArticlePreviewProps {
  title: string;
  excerpt: string;
  content: string;
  coverUrl: string;
}

export function ArticlePreview({ title, excerpt, content, coverUrl }: ArticlePreviewProps) {
  const { blocks } = parseArticleContent(content);

  return (
    <article className="mx-auto w-full max-w-[760px] bg-white px-5 py-6 sm:px-8">
      <h1 className="font-serif text-3xl font-black leading-tight text-[#0F172A]">
        {title || "Tiêu đề bài viết"}
      </h1>
      {excerpt && (
        <p className="mt-3 text-[15px] font-medium leading-relaxed text-[#475569]">
          <ArticleInline text={excerpt} />
        </p>
      )}
      {coverUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={coverUrl} alt={title || "Ảnh bìa bài viết"} className="mt-5 w-full rounded-lg object-cover" />
      )}

      <div className="mt-6">
        {blocks.length === 0 ? (
          <p className="text-sm text-[#94A3B8]">Nội dung xem trước sẽ hiển thị tại đây.</p>
        ) : (
          blocks.map((block, index) => {
            if (block.type === "heading") {
              return block.level === 2 ? (
                <h2 key={index} className="mb-3 mt-7 font-serif text-xl font-black text-[#0F172A] first:mt-0">
                  <ArticleInline text={block.text} />
                </h2>
              ) : (
                <h3 key={index} className="mb-2 mt-5 text-base font-bold text-[#0F172A]">
                  <ArticleInline text={block.text} />
                </h3>
              );
            }

            if (block.type === "image") {
              return (
                <figure key={index} className="mb-6 mt-5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={block.url}
                    alt={block.alt || title}
                    className="w-full rounded-lg border border-black/5 object-cover"
                  />
                  {block.alt && <figcaption className="mt-2 text-center text-xs text-[#94A3B8]">{block.alt}</figcaption>}
                </figure>
              );
            }

            if (block.type === "list") {
              const items = block.items.map((item, itemIndex) => (
                <li key={itemIndex} className="pl-1 leading-[1.8]">
                  <ArticleInline text={item} />
                </li>
              ));

              return block.ordered ? (
                <ol key={index} className="mb-5 list-decimal space-y-1 pl-6 text-[14.5px] text-[#334155]">
                  {items}
                </ol>
              ) : (
                <ul key={index} className="mb-5 list-disc space-y-1 pl-6 text-[14.5px] text-[#334155]">
                  {items}
                </ul>
              );
            }

            if (block.type === "quote") {
              return (
                <blockquote
                  key={index}
                  className="mb-5 border-l-4 border-[#E8547A] bg-[#FFF7FA] px-4 py-3 text-[14.5px] italic leading-[1.8] text-[#475569]"
                >
                  <ArticleInline text={block.text} />
                </blockquote>
              );
            }

            if (block.type === "table") {
              return (
                <div key={index} className="mb-6 overflow-x-auto rounded-lg border border-black/10">
                  <table className="w-full min-w-[480px] border-collapse text-left text-[13px] text-[#334155]">
                    <thead className="bg-[#FFF0F5] text-[#0F172A]">
                      <tr>
                        {block.headers.map((header, headerIndex) => (
                          <th key={headerIndex} className="border-b border-black/10 px-3 py-2.5 font-bold">
                            <ArticleInline text={header} />
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {block.rows.map((row, rowIndex) => (
                        <tr key={rowIndex} className="border-b border-black/5 last:border-b-0">
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex} className="px-3 py-2.5 align-top leading-relaxed">
                              <ArticleInline text={cell} />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            }

            return (
              <p key={index} className="mb-4 whitespace-pre-line text-[14.5px] leading-[1.8] text-[#334155]">
                <ArticleInline text={block.text} />
              </p>
            );
          })
        )}
      </div>
    </article>
  );
}
