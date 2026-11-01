import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  BrowserRouter,
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowDown,
  List,
  X,
  ArrowCounterClockwise,
  Cube,
  Code,
  Wrench,
  Lightning,
  Camera,
  UsersThree,
  Check,
  CaretRight,
} from "@phosphor-icons/react";
const RobotScene = lazy(() => import("./components/RobotScene.jsx"));

const onshapeLink =
  "https://cad.onshape.com/documents/d4fbdad2581c86908ab46aaf/w/a6e091fa73f6c509106f457d/e/a145ee53c94039aed550e8d4";
const navigation = [
  ["Team", "/team"],
  ["Robots", "/robots"],
  ["Outreach", "/outreach"],
  ["Partners", "/partners"],
  ["Contact", "/contact"],
];
const stages = ["Chassis", "Systems", "Ready"];
const disciplines = [
  {
    id: "mechanical",
    label: "Mechanical",
    icon: Wrench,
    title: "Ideas you can hold.",
    copy: "Turn sketches into mechanisms. Explore CAD, fabrication, assembly, and the patient work of making parts fit.",
    detail: "Design / Prototyping / Fabrication",
  },
  {
    id: "electrical",
    label: "Electrical",
    icon: Lightning,
    title: "Make the connections.",
    copy: "Bring power and signals to the robot. Wiring, sensors, and careful troubleshooting connect each mechanism to the control system.",
    detail: "Wiring / Sensors / Controls",
  },
  {
    id: "software",
    label: "Software",
    icon: Code,
    title: "Give the machine a plan.",
    copy: "Build the logic behind movement. Robot control, autonomous routines, and driver feedback bring code into the physical world.",
    detail: "Robot code / Automation / Testing",
  },
  {
    id: "outreach",
    label: "Outreach & media",
    icon: Camera,
    title: "Bring people into the story.",
    copy: "Make robotics approachable. Photography, communication, event planning, and teaching help people connect with the team.",
    detail: "Storytelling / Events / Community",
  },
];
function navigateTabs(event, keys, selected, setSelected, prefix) {
  let index = keys.indexOf(selected);
  if (["ArrowRight", "ArrowDown"].includes(event.key))
    index = (index + 1) % keys.length;
  else if (["ArrowLeft", "ArrowUp"].includes(event.key))
    index = (index + keys.length - 1) % keys.length;
  else if (event.key === "Home") index = 0;
  else if (event.key === "End") index = keys.length - 1;
  else return;
  event.preventDefault();
  setSelected(keys[index]);
  requestAnimationFrame(() =>
    document.getElementById(prefix + keys[index])?.focus(),
  );
}
function Button({ to, children, external = false, light = false }) {
  if (external)
    return (
      <a
        className={"button " + (light ? "button-light" : "")}
        href={to}
        target="_blank"
        rel="noreferrer"
      >
        {children}
        <ArrowUpRight size={18} />
      </a>
    );
  return (
    <Link className={"button " + (light ? "button-light" : "")} to={to}>
      {children}
      <ArrowRight size={18} />
    </Link>
  );
}
function Brand() {
  return (
    <Link
      to="/"
      className="brand"
      aria-label="Binary Bolts home"
      onClick={(event) => {
        if (
          !event.metaKey &&
          !event.ctrlKey &&
          window.location.pathname === "/"
        )
          window.scrollTo({ top: 0, behavior: "instant" });
      }}
    >
      <span>BINARY BOLTS</span>
      <i>/</i>
      <b>8570</b>
    </Link>
  );
}
function Header() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);
  useEffect(() => {
    const close = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, []);
  return (
    <header className="site-header">
      <Brand />
      <button
        className="menu-toggle"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="primary-nav"
        aria-label={open ? "Close navigation" : "Open navigation"}
      >
        {open ? <X size={24} /> : <List size={24} />}
      </button>
      <nav
        id="primary-nav"
        aria-label="Main navigation"
        className={open ? "open" : ""}
      >
        {navigation.map(([label, path]) => (
          <NavLink key={path} to={path}>
            {label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <Brand />
        <p>
          People. Machines.
          <br />A reason to build.
        </p>
        <Link to="/contact" className="footer-contact">
          Start a conversation
          <ArrowUpRight size={23} />
        </Link>
      </div>
      <div className="footer-bottom">
        <span>FIRST® Robotics Competition · Team 8570</span>
        <nav aria-label="Footer navigation">
          {navigation.slice(0, 4).map(([label, path]) => (
            <Link to={path} key={path}>
              {label}
            </Link>
          ))}
        </nav>
        <span>Binary Bolts</span>
      </div>
    </footer>
  );
}
function PageTitle({ label, title, children }) {
  return (
    <div className="page-title">
      <span className="eyebrow">{label}</span>
      <h1>{title}</h1>
      {children && <p>{children}</p>}
    </div>
  );
}
function SceneFallback() {
  return (
    <div className="model-status" role="status">
      <span className="model-status-rule" />
      <span>Preparing the 3D view</span>
    </div>
  );
}
function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}
function Home() {
  const track = useRef(null);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const reduced = useReducedMotion();
  useEffect(() => {
    let frame;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!track.current) return;
        const rect = track.current.getBoundingClientRect();
        const headerHeight =
          document.querySelector(".site-header").offsetHeight;
        const scrollable = rect.height - window.innerHeight + headerHeight;
        setProgress(
          Math.max(0, Math.min(1, (headerHeight - rect.top) / scrollable)),
        );
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  const active = progress < 0.34 ? 0 : progress < 0.78 ? 1 : 2;
  function goToStage(stage) {
    const el = track.current;
    const headerHeight = document.querySelector(".site-header").offsetHeight;
    const top = window.scrollY + el.getBoundingClientRect().top - headerHeight;
    const distance = el.offsetHeight - window.innerHeight + headerHeight;
    window.scrollTo({
      top: top + distance * [0, 0.54, 1][stage],
      behavior: reduced ? "auto" : "smooth",
    });
  }
  return (
    <>
      <section
        className={"assembly-track " + (reduced ? "reduced-motion" : "")}
        ref={track}
      >
        <div className="assembly-stage">
          <div className="hero-copy">
            <span className="eyebrow">Students / Robots / Community</span>
            <h1>
              Built
              <br />
              together.
            </h1>
            <i className="accent-line" />
            <p>
              Explore the people, machines,
              <br className="desktop-break" /> and work behind Team 8570.
            </p>
            <Button to="/team">Explore the team</Button>
          </div>
          <div className="hero-model">
            <Suspense fallback={<SceneFallback />}>
              <RobotScene
                progress={reduced ? 1 : progress}
                onReady={() => setReady(true)}
              />
            </Suspense>
          </div>
          <span className="model-caption">Cannonbolt / Final assembly</span>
          <div className="assembly-bottom">
            <button
              className="scroll-cue"
              onClick={() => goToStage(active === 2 ? 0 : active + 1)}
            >
              <ArrowDown size={44} weight="thin" />
              <span>
                {active === 2 ? "Replay the assembly" : "Scroll to assemble"}
              </span>
            </button>
            <div
              className="assembly-progress"
              style={{ "--progress": progress }}
              aria-label="Assembly stages"
            >
              {stages.map((stage, i) => (
                <button
                  onClick={() => goToStage(i)}
                  key={stage}
                  aria-current={active === i ? "step" : undefined}
                >
                  <span className="stage-dot" />
                  <span>{stage}</span>
                </button>
              ))}
            </div>
            <span className="stage-count">
              {ready ? "0" + (active + 1) + " / 03" : "Loading model"}
            </span>
          </div>
        </div>
      </section>
      <section className="purpose-section">
        <div className="purpose-image">
          <img
            src="/assets/mechanism-detail.jpg"
            alt="Close study of a machined robot mechanism"
            loading="lazy"
          />
          <span>Engineering detail / Design study</span>
        </div>
        <div className="purpose-copy">
          <h2>
            Every part
            <br />
            has a purpose.
          </h2>
          <i className="accent-line" />
          <p>
            From the first sketch to the final match, a robot takes shape
            through ideas, experiments, and the people willing to try again.
          </p>
          <p>
            We’re Binary Bolts, FRC Team 8570. This is where we share what we
            build, how we learn, and the people behind it.
          </p>
          <Link to="/robots" className="text-link">
            Meet Cannonbolt
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
      <section className="home-links">
        <Link to="/team">
          <span className="eyebrow">01 / The people</span>
          <h3>Find your place.</h3>
          <ArrowUpRight size={26} />
        </Link>
        <Link to="/outreach">
          <span className="eyebrow">02 / Beyond the field</span>
          <h3>Make a connection.</h3>
          <ArrowUpRight size={26} />
        </Link>
        <Link to="/partners">
          <span className="eyebrow">03 / The next build</span>
          <h3>Be part of it.</h3>
          <ArrowUpRight size={26} />
        </Link>
      </section>
    </>
  );
}
function Team() {
  const [selected, setSelected] = useState("mechanical");
  const discipline = disciplines.find((item) => item.id === selected);
  const Icon = discipline.icon;
  return (
    <article className="interior-page team-page">
      <PageTitle
        label="The team / 8570"
        title={
          <>
            Different skills.
            <br />
            Shared curiosity.
          </>
        }
      >
        Binary Bolts is a FIRST Robotics Competition team. Engineering brings us
        together; collaboration turns individual ideas into something we can
        build.
      </PageTitle>
      <section className="discipline-section">
        <div className="section-heading">
          <span className="eyebrow">Ways to contribute</span>
          <h2>
            There’s a whole
            <br />
            team behind it.
          </h2>
        </div>
        <div className="discipline-explorer">
          <div
            className="discipline-tabs"
            role="tablist"
            aria-label="Team disciplines"
          >
            {disciplines.map((item) => (
              <button
                role="tab"
                tabIndex={selected === item.id ? 0 : -1}
                onKeyDown={(event) =>
                  navigateTabs(
                    event,
                    disciplines.map((item) => item.id),
                    selected,
                    setSelected,
                    "tab-",
                  )
                }
                key={item.id}
                id={"tab-" + item.id}
                aria-controls={"panel-" + item.id}
                aria-selected={selected === item.id}
                onClick={() => setSelected(item.id)}
              >
                {item.label}
                <CaretRight size={15} />
              </button>
            ))}
          </div>
          <div
            className="discipline-panel"
            role="tabpanel"
            tabIndex={0}
            id={"panel-" + selected}
            aria-labelledby={"tab-" + selected}
          >
            <Icon size={40} weight="light" />
            <h3>{discipline.title}</h3>
            <p>{discipline.copy}</p>
            <span className="eyebrow">{discipline.detail}</span>
          </div>
        </div>
      </section>
      <section className="light-callout">
        <span className="eyebrow">FIRST Robotics Competition</span>
        <h2>
          A challenge that
          <br />
          takes everyone.
        </h2>
        <div>
          <p>
            FRC brings students and mentors together to design and build robots
            for a new competition game each season. Along the way, teams develop
            skills in engineering, communication, and collaboration.
          </p>
          <Button to="https://www.firstinspires.org/robotics/frc" external>
            Explore FIRST
          </Button>
        </div>
      </section>
      <section className="end-callout">
        <h2>Start with curiosity.</h2>
        <Button to="/contact">Get involved</Button>
      </section>
    </article>
  );
}
function Robots() {
  const [separation, setSeparation] = useState(0);
  const [reset, setReset] = useState(0);
  const [selected, setSelected] = useState("chassis");
  const subsystems = {
    chassis: [
      "Chassis",
      "The foundation.",
      "The assembly includes a chassis with swerve modules and the structure supporting the robot’s mechanisms.",
    ],
    spindexer: [
      "Spindexer",
      "At the center of the system.",
      "Explore the spindexer and feeder assembly in the original CAD. The model brings its plates, guides, wheels, and supports together.",
    ],
    intake: [
      "Four-bar intake",
      "A mechanism in motion.",
      "The FourBar V3 assembly includes the intake structure, linkage, rollers, and its drive components.",
    ],
    electrical: [
      "Electrical",
      "Power meets control.",
      "The model includes a power distribution hub, main breaker, controller mounts, and other electrical components.",
    ],
  };
  return (
    <article className="interior-page robots-page">
      <PageTitle
        label="The robots / Cannonbolt"
        title={
          <>
            Meet the
            <br />
            <em>machine.</em>
          </>
        }
      >
        Take a closer look at Cannonbolt, the robot in Team 8570’s shared final
        assembly.
      </PageTitle>
      <section className="robot-lab" id="robot-viewer">
        <div className="robot-lab-heading">
          <span className="eyebrow">
            <Cube size={16} /> Cannonbolt / 8570
          </span>
          <button
            className="quiet-button"
            onClick={() => {
              setReset(reset + 1);
              setSeparation(0);
            }}
          >
            <ArrowCounterClockwise size={18} />
            Reset view
          </button>
        </div>
        <div className="robot-lab-canvas">
          <Suspense fallback={<SceneFallback />}>
            <RobotScene
              interactive
              progress={1 - separation / 100}
              resetKey={reset}
            />
          </Suspense>
        </div>
        <div className="robot-lab-controls">
          <span className="viewer-hint">Drag to rotate · Scroll to zoom</span>
          <label htmlFor="separation">
            Assembled
            <input
              id="separation"
              aria-label="Separate robot assemblies"
              type="range"
              value={separation}
              min="0"
              max="100"
              onChange={(event) => setSeparation(Number(event.target.value))}
            />
            <span>Exploded</span>
          </label>
        </div>
      </section>
      <section className="subsystem-section">
        <div className="section-heading">
          <span className="eyebrow">Inside Cannonbolt</span>
          <h2>A closer look.</h2>
        </div>
        <div
          className="subsystem-tabs"
          role="tablist"
          aria-label="Robot subsystems"
        >
          {Object.entries(subsystems).map(([key, value]) => (
            <button
              role="tab"
              tabIndex={selected === key ? 0 : -1}
              onKeyDown={(event) =>
                navigateTabs(
                  event,
                  Object.keys(subsystems),
                  selected,
                  setSelected,
                  "sub-tab-",
                )
              }
              id={"sub-tab-" + key}
              aria-controls={"sub-panel-" + key}
              aria-selected={selected === key}
              key={key}
              onClick={() => setSelected(key)}
            >
              {value[0]}
            </button>
          ))}
        </div>
        <div
          className="subsystem-content"
          role="tabpanel"
          id={"sub-panel-" + selected}
          aria-labelledby={"sub-tab-" + selected}
        >
          <span className="eyebrow">{subsystems[selected][0]}</span>
          <h3>{subsystems[selected][1]}</h3>
          <p>{subsystems[selected][2]}</p>
          <a
            className="text-link"
            href={onshapeLink}
            target="_blank"
            rel="noreferrer"
          >
            Open original CAD
            <ArrowUpRight size={18} />
          </a>
        </div>
      </section>
      <section className="archive-section">
        <span className="eyebrow">Robot archive</span>
        <h2>
          Keep the lessons.
          <br />
          Build the next one.
        </h2>
        <p>
          Season records, technical notes, and previous robots will join this
          archive as the team’s material is collected.
        </p>
        <a className="archive-entry" href="#robot-viewer">
          <span>Cannonbolt</span>
          <span>Final robot assembly</span>
          <Cube size={22} />
        </a>
      </section>
    </article>
  );
}
function Outreach() {
  const [filter, setFilter] = useState("All");
  return (
    <article className="interior-page outreach-page">
      <PageTitle
        label="Outreach / Community"
        title={
          <>
            Beyond
            <br />
            the field.
          </>
        }
      >
        A robot can start a conversation. Workshops, demonstrations, and shared
        knowledge can keep it going.
      </PageTitle>
      <section className="outreach-intro">
        <span className="eyebrow">Share the curiosity</span>
        <h2>
          A first build.
          <br />A new possibility.
        </h2>
        <p>
          This space will document Binary Bolts’ outreach with real event
          stories, dates, partners, and photographs.
        </p>
      </section>
      <section className="stories-section">
        <div className="stories-header">
          <h2>Outreach journal</h2>
          <div
            className="filter-tabs"
            role="group"
            aria-label="Filter outreach stories"
          >
            {["All", "Workshops", "Demonstrations", "Mentoring"].map((item) => (
              <button
                key={item}
                aria-pressed={filter === item}
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="empty-journal">
          <span className="journal-index">/ 01</span>
          <div>
            <h3>
              {filter === "All"
                ? "The journal starts here."
                : filter + " stories are on the way."}
            </h3>
            <p>
              We’re gathering the team’s event material. Check back for the
              people, places, and small moments behind the work.
            </p>
          </div>
          <UsersThree size={44} weight="thin" />
        </div>
      </section>
      <section className="end-callout">
        <h2>
          Have an idea
          <br />
          we could build on?
        </h2>
        <Button to="/contact?interest=outreach">Plan something together</Button>
      </section>
    </article>
  );
}
function Partners() {
  return (
    <article className="interior-page partners-page">
      <PageTitle
        label="Partners / Support"
        title={
          <>
            Make the next
            <br />
            build possible.
          </>
        }
      >
        Support can take many forms: materials, expertise, time, workspace, or
        funding. Each can give students more room to learn.
      </PageTitle>
      <section className="support-list">
        {[
          [
            "01",
            "Parts & materials",
            "Components, manufacturing support, and tools help turn a design into a working machine.",
          ],
          [
            "02",
            "People & expertise",
            "Mentoring and technical guidance give students someone to learn with as they take on new challenges.",
          ],
          [
            "03",
            "Funding & opportunity",
            "Financial support can help with the practical costs of building, learning, and participating.",
          ],
        ].map(([n, title, copy]) => (
          <div key={n}>
            <span>{n}</span>
            <h2>{title}</h2>
            <p>{copy}</p>
          </div>
        ))}
      </section>
      <section className="light-callout">
        <span className="eyebrow">Build a partnership</span>
        <h2>
          Bring your strengths.
          <br />
          Help us find ours.
        </h2>
        <div>
          <p>
            We’d like to hear from people and organizations interested in
            supporting student robotics. Tell us what you have in mind.
          </p>
          <Button to="/contact?interest=partnership">
            Talk about partnering
          </Button>
        </div>
      </section>
    </article>
  );
}
function Contact() {
  const location = useLocation();
  const interest =
    new URLSearchParams(location.search).get("interest") || "joining";
  const [values, setValues] = useState({
    name: "",
    email: "",
    interest,
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  function update(event) {
    setValues({ ...values, [event.target.name]: event.target.value });
    setSubmitted(false);
  }
  function submit(event) {
    event.preventDefault();
    setSubmitted(true);
  }
  return (
    <article className="interior-page contact-page">
      <PageTitle
        label="Contact / Get involved"
        title={
          <>
            Every build
            <br />
            starts somewhere.
          </>
        }
      >
        Interested in joining, mentoring, collaborating, or supporting the team?
        Start here.
      </PageTitle>
      <section className="contact-layout">
        <div className="contact-note">
          <span className="eyebrow">Talk to Binary Bolts</span>
          <h2>
            Tell us what
            <br />
            you’re thinking.
          </h2>
          <p>
            The team’s verified contact address will be added before launch. You
            can try the form below as a prototype; it won’t send a message.
          </p>
          <a
            className="text-link"
            href={onshapeLink}
            target="_blank"
            rel="noreferrer"
          >
            Explore our robot CAD
            <ArrowUpRight size={18} />
          </a>
        </div>
        <form onSubmit={submit} className="contact-form">
          <div className="form-row">
            <label>
              Your name
              <input
                name="name"
                autoComplete="name"
                value={values.name}
                onChange={update}
                required
              />
            </label>
            <label>
              Email address
              <input
                name="email"
                type="email"
                autoComplete="email"
                value={values.email}
                onChange={update}
                required
              />
            </label>
          </div>
          <label>
            I’m interested in
            <select name="interest" value={values.interest} onChange={update}>
              <option value="joining">Joining the team</option>
              <option value="mentoring">Mentoring</option>
              <option value="outreach">Outreach & collaboration</option>
              <option value="partnership">Supporting the team</option>
              <option value="other">Something else</option>
            </select>
          </label>
          <label>
            Your message
            <textarea
              name="message"
              rows="5"
              value={values.message}
              onChange={update}
              required
            />
          </label>
          <button className="button" type="submit">
            Preview message
            <ArrowRight size={18} />
          </button>
          {submitted && (
            <div className="form-confirmation" role="status">
              <Check size={21} />
              <span>
                Thanks, {values.name}. Your message preview is ready. Nothing
                has been sent.
              </span>
            </div>
          )}
        </form>
      </section>
    </article>
  );
}
function NotFound() {
  return (
    <article className="interior-page not-found">
      <PageTitle
        label="404 / Wrong turn"
        title={
          <>
            Back to
            <br />
            the workshop.
          </>
        }
      >
        That page isn’t here. The team and robot are one click away.
      </PageTitle>
      <Button to="/">Return home</Button>
    </article>
  );
}
function Site() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    const name = navigation.find(([, path]) => path === location.pathname)?.[0];
    document.title =
      (name ? name + " — " : "") + "Binary Bolts · FRC Team 8570";
  }, [location.pathname]);
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Header />
      <main id="main-content" tabIndex="-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/team" element={<Team />} />
          <Route path="/robots" element={<Robots />} />
          <Route path="/outreach" element={<Outreach />} />
          <Route path="/partners" element={<Partners />} />
          <Route path="/contact" element={<Contact key={location.search} />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
export function App() {
  return (
    <BrowserRouter>
      <Site />
    </BrowserRouter>
  );
}
