import { Reveal } from "../components/Reveal";
import { Accordion, EmptyState } from "@shared/ui";
import type { Faq } from "@shared/types";

export function FaqSection({ faqs }: { faqs: Faq[] }) {
  if (!faqs.length) {
    return <EmptyState className="mt-7" title="No questions published yet" />;
  }

  return (
    <div className="mt-7 max-w-[78ch]">
      {faqs.map((item, i) => (
        <Reveal key={item.id} delay={Math.min(i * 40, 300)}>
          <Accordion
            headerClassName="py-4"
            bodyClassName="pb-4"
            header={<span className="font-semibold group-hover:text-primary">{item.question}</span>}
          >
            <p className="max-w-[70ch] text-ink-2">{item.answer}</p>
          </Accordion>
        </Reveal>
      ))}
    </div>
  );
}
