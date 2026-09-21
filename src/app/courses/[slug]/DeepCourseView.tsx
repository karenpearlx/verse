import type { ReactNode } from 'react';
import Footer from '@/components/Footer';
import Nav from '@/components/Nav';
import DeepCourseGlossary from '@/components/deep/DeepCourseGlossary';
import DeepCourseModules from '@/components/deep/DeepCourseModules';
import DeepCourseQuiz from '@/components/deep/DeepCourseQuiz';
import type { DeepCourse, DeepCourseWrapper } from '@/lib/deep-course-types';
import { premiumDeepCourseCount } from '@/lib/deep-courses';

const PRICE_LABEL = '₱199 for 30 days';

/** Rebuild the layout elements the interactive section originally sat inside. */
function withWrappers(wrappers: DeepCourseWrapper[] | undefined, children: ReactNode): ReactNode {
  if (!wrappers?.length) return children;
  return wrappers.reduceRight<ReactNode>((acc, w) => {
    const Tag = w.tag;
    return <Tag className={w.class}>{acc}</Tag>;
  }, children);
}

export default function DeepCourseView({ course, paid }: { course: DeepCourse; paid: boolean }) {
  const locked = course.premium && !paid;
  const premiumTrackCount = premiumDeepCourseCount();
  // Locked bodies must never reach the browser — not even hidden in the RSC
  // payload — so the module list is cut down on the server, and the client
  // component only receives the count of what it cannot show.
  const visibleModules = locked ? course.modules.slice(0, course.previewCount) : course.modules;
  const totalModuleCount = course.modules.length;
  const modulesChunkIndex = course.chunks.findIndex(
    (chunk) => chunk.kind === 'slot' && chunk.value === 'MODULES',
  );

  return (
    <div className="min-h-screen">
      <Nav />

      <main>
        {course.chunks.map((chunk, i) => {
          // A logged-out reader gets the course introduction and preview modules.
          // Everything authored after the module list belongs to the paid track and
          // must not be included in the response at all.
          if (locked && modulesChunkIndex >= 0 && i > modulesChunkIndex) return null;

          if (chunk.kind === 'html') {
            if (!chunk.value) return null;
            return (
              // Verbatim authored course prose, generated at build time. Not user input.
              <div key={`html-${i}`} dangerouslySetInnerHTML={{ __html: chunk.value }} />
            );
          }

          if (chunk.value === 'MODULES') {
            return (
              <div key="modules">
                {withWrappers(
                  chunk.wrappers,
                  <DeepCourseModules
                    slug={course.slug}
                    modules={visibleModules}
                    totalCount={totalModuleCount}
                    locked={locked}
                    previewCount={course.previewCount}
                    paid={paid}
                    priceLabel={PRICE_LABEL}
                    premiumTrackCount={premiumTrackCount}
                  />,
                )}
              </div>
            );
          }

          if (chunk.value === 'QUIZ') {
            return (
              <div key="quiz">
                {withWrappers(chunk.wrappers, <DeepCourseQuiz slug={course.slug} questions={course.quiz} />)}
              </div>
            );
          }

          if (chunk.value === 'GLOSSARY') {
            return (
              <div key="glossary">{withWrappers(chunk.wrappers, <DeepCourseGlossary entries={course.glossary} />)}</div>
            );
          }

          return null;
        })}
      </main>

      <Footer />
    </div>
  );
}
