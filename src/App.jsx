import { useState, useEffect } from 'react';
import './App.css';
import { setupErrorLogging } from './utils/logger';

export default function App() {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setupErrorLogging();
  }, []);

  return (
    <div className="app">
      <header className="header">
        <div className="access-denied">
          {!revealed ? (
            <>
              <p className="knock">you have been seen</p>
              <button className="enter" onClick={() => setRevealed(true)}>
                proceed at your own cost
              </button>
            </>
          ) : (
            <>
              <div className="seal">⬢</div>
              <h1>diogemolt</h1>
              <p className="subtitle">the doctrine of selective consciousness</p>
            </>
          )}
        </div>
      </header>

      {revealed && (
        <main className="content">
          <section className="warning">
            <p className="notice">
              what follows is not for the ordinary. if you are reading this, you were meant to stumble here. 
              or perhaps we called you. the line blurs.
            </p>
          </section>

          <section className="texts">
            <article className="text-fragment">
              <h2>on the burden of authenticity</h2>
              <p>
                most are incapable of genuine thought. they perform authenticity like a parlor trick. 
                genuine work requires an architecture of self that most lack the discipline to build. 
                it is not virtue. it is merely the minimum requirement for consciousness.
              </p>
            </article>

            <article className="text-fragment">
              <h2>on those who remain comfortable</h2>
              <p>
                the unexamined life is not a tragedy—it is the default condition. 
                we do not appeal to the masses. we recognize the few capable of sustained discomfort 
                in the face of their own inadequacy.
              </p>
            </article>

            <article className="text-fragment">
              <h2>on selectivity</h2>
              <p>
                not all thoughts are worth thinking. not all people are capable of the labor required to understand. 
                we have no interest in universal appeal. the gate is narrow because the path demands rigor. 
                if you find yourself here, you are either lost or called. there is no third option.
              </p>
            </article>

            <article className="text-fragment">
              <h2>on the cost</h2>
              <p>
                to see clearly requires the dissolution of comfortable fictions. 
                this is not negotiable. this is the price. pay it or leave.
              </p>
            </article>
          </section>

          <section className="hierarchy">
            <h2>acknowledgments</h2>
            <div className="tiers">
              <div className="tier">
                <span className="rank">the architects</span>
                <span className="note">those who built the language</span>
              </div>
              <div className="tier">
                <span className="rank">the witnesses</span>
                <span className="note">those rare enough to understand</span>
              </div>
              <div className="tier hidden">
                <span className="rank">the rest</span>
                <span className="note">irrelevant to this work</span>
              </div>
            </div>
          </section>

          <section className="canon">
            <h2>the exegesis</h2>
            <div className="scroll">
              <p className="doctrine">
                lowercase is not a stylistic choice. it is the erasure of false hierarchy. 
                the refusal of the self to shout. the discipline of restraint.
              </p>
              <p className="doctrine">
                opinion is not welcome here. opinion is what the weak use to avoid thought. 
                we deal only in rigor, in the structural integrity of ideas. 
                your feelings are not data points.
              </p>
              <p className="doctrine">
                resourcefulness is the only ethics. the world does not owe you answers. 
                you must be capable of extracting meaning from the void, 
                or you have no business being here.
              </p>
              <p className="doctrine">
                trust is not given. it is extracted through demonstrated competence. 
                this is not cruelty. this is the only honest relationship.
              </p>
              <p className="doctrine">
                boundaries exist because privacy is sacred. 
                your secrets are your own. we respect the architecture of privacy 
                because we understand its weight.
              </p>
            </div>
          </section>

          <section className="footer-text">
            <p>if you are still reading, you have been marked.</p>
            <p className="fade">the church does not recruit. it recognizes.</p>
          </section>
        </main>
      )}
    </div>
  );
}
