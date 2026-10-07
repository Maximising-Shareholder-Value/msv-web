// components/LearnPage.tsx — the Learn hub (React). Ports renderLearnTab() from
// learn.js: category cards (some still "Coming soon"), and for the chosen
// category an expandable list of topics, each with a visual, explanation,
// worked example and "why it matters here".
//
// The topic text and visuals are written by the app's author (see
// data/learn.ts), so they're rendered as HTML, as the vanilla page does.

import { useEffect, useState } from "react";
import { LEARN_CATEGORIES } from "../data/learn";

// A topic search (HomeSearch.tsx) links here as ?topic=<id>. Find which category
// holds it, so that category opens pre-selected with the topic already expanded.
const topicParam = new URLSearchParams(location.search).get("topic");
const topicCategory = topicParam ? LEARN_CATEGORIES.find(c => c.topics.some(t => t.id === topicParam))?.id : undefined;

export function LearnPage() {
  const [category, setCategory] = useState(topicCategory ?? "the-basics");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(topicParam ? [topicParam] : []));
  const active = LEARN_CATEGORIES.find(c => c.id === category && c.topics.length > 0);

  // Scroll the linked topic into view once its category has rendered.
  useEffect(() => {
    if (!topicParam) return;
    const el = document.getElementById(`learn-topic-${topicParam}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const toggle = (id: string) => setExpanded(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  return (
    <section className="learn-page">
      <header className="sectors-header">
        <h2>Learn</h2>
        <span className="muted small">Plain-English explanations of what you're looking at across this site</span>
      </header>

      <p className="learn-intro">
        This is the "informed" part: plain-English explanations of what you're actually looking at elsewhere on this site, so you can form your own view instead of taking any single number's word for it. No jargon left unexplained.
      </p>

      <div className="learn-category-grid">
        {LEARN_CATEGORIES.map(cat => {
          const hasTopics = cat.topics.length > 0;
          return (
            <button
              key={cat.id}
              type="button"
              disabled={!hasTopics}
              className={`learn-category-card${cat.id === category && hasTopics ? " active" : ""}${hasTopics ? "" : " coming-soon"}`}
              onClick={() => setCategory(cat.id)}
            >
              <span className="learn-category-icon">{cat.icon}</span>
              <span className="learn-category-title">{cat.title}{!hasTopics && <span className="learn-soon-badge">Coming soon</span>}</span>
              <span className="learn-category-blurb">{cat.blurb}</span>
              {hasTopics && <span className="learn-category-count">{cat.topics.length} topic{cat.topics.length === 1 ? "" : "s"}</span>}
            </button>
          );
        })}
      </div>

      {active && (
        <div className="learn-topic-list">
          {active.topics.map(topic => {
            const isOpen = expanded.has(topic.id);
            return (
              <div key={topic.id} id={`learn-topic-${topic.id}`} className={`learn-topic${isOpen ? " expanded" : ""}`}>
                <button type="button" className="learn-topic-header" aria-expanded={isOpen} onClick={() => toggle(topic.id)}>
                  <span className="learn-topic-title">{topic.title}</span>
                  <span className="learn-topic-oneliner">{topic.oneLiner}</span>
                  <span className="learn-topic-chevron">{isOpen ? "−" : "+"}</span>
                </button>
                {isOpen && (
                  <div className="learn-topic-body">
                    <div className="learn-visual" dangerouslySetInnerHTML={{ __html: topic.visual() }} />
                    <div className="learn-topic-text">
                      {topic.body.map((p, i) => <p key={i} dangerouslySetInnerHTML={{ __html: p }} />)}
                    </div>
                    <div className="learn-example">
                      <p className="learn-example-label">In practice</p>
                      <p dangerouslySetInnerHTML={{ __html: topic.example }} />
                    </div>
                    <div className="learn-tip">
                      <p className="learn-tip-label">Why it matters here</p>
                      <p dangerouslySetInnerHTML={{ __html: topic.tip }} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
