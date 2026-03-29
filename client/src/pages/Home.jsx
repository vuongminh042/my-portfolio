import { useEffect, useState } from 'react';
import api from '../api';
import { socket } from '../realtime';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import About from '../components/About';
import SkillsSection from '../components/SkillsSection';
import ProjectsSection from '../components/ProjectsSection';
import ContactSection from '../components/ContactSection';
import Footer from '../components/Footer';

export default function Home() {
  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      try {
        const [p, s, pr] = await Promise.all([
          api.get('/api/profile/public'),
          api.get('/api/skills'),
          api.get('/api/projects'),
        ]);
        if (!cancelled) {
          setProfile(p);
          setSkills(s);
          setProjects(pr);
          setLoadError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(e.message);
          setProfile({});
          setSkills([]);
          setProjects([]);
        }
      }
    }

    loadAll();

    const handler = (payload) => {
      if (!payload || !payload.type) return;
      loadAll();
    };

    socket.on('portfolio:updated', handler);

    return () => {
      cancelled = true;
      socket.off('portfolio:updated', handler);
    };
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar />
      {loadError && (
        <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-lg glass rounded-xl px-4 py-3 text-sm text-amber-800 dark:text-amber-300 border border-amber-400/50 dark:border-amber-500/30">
          Không kết nối được API ({loadError}). Chạy server và MongoDB, hoặc kiểm tra proxy.
        </div>
      )}
      <Hero profile={profile} />
      <About profile={profile} />
      <SkillsSection skills={skills} />
      <ProjectsSection projects={projects} />
      <ContactSection />
      <Footer />
    </div>
  );
}
