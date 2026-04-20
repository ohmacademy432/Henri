import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import { BookProvider } from './lib/book';
import { MenuProvider } from './lib/menu';
import { MenuOverlay } from './components/MenuOverlay';
import { Login } from './routes/Login';
import { ResetPassword } from './routes/ResetPassword';
import { Accept } from './routes/Accept';
import { Welcome } from './routes/Welcome';
import { Layout } from './routes/Layout';
import { Today } from './routes/Today';
import { Settings } from './routes/Settings';
import { List as MemoriesList } from './routes/memories/List';
import { New as MemoriesNew } from './routes/memories/New';
import { Detail as MemoryDetail } from './routes/memories/Detail';
import { Index as HealthIndex } from './routes/health/Index';
import { GrowthNew } from './routes/health/GrowthNew';
import { IllnessNew } from './routes/health/IllnessNew';
import { Print } from './routes/Print';
import { Index as FamilyIndex } from './routes/family/Index';
import { New as FamilyNew } from './routes/family/New';
import { Detail as FamilyDetail } from './routes/family/Detail';
import { Index as MedicationsIndex } from './routes/medications/Index';
import { New as MedicationsNew } from './routes/medications/New';
import { Detail as MedicationsDetail } from './routes/medications/Detail';
import { DoseNew } from './routes/medications/DoseNew';
import { Invitations } from './routes/Invitations';
import { About } from './routes/About';
import { Counsel } from './routes/Counsel';
import { Dedication } from './routes/Dedication';
import { RequireAuth, RequireBook } from './routes/guards';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BookProvider>
          <MenuProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/accept/:token" element={<Accept />} />

              <Route element={<RequireAuth />}>
                <Route path="/welcome" element={<Welcome />} />

                <Route element={<RequireBook />}>
                  <Route path="/dedication" element={<Dedication />} />
                  <Route element={<Layout />}>
                    <Route path="/today" element={<Today />} />
                    <Route path="/memories" element={<MemoriesList />} />
                    <Route path="/memories/new" element={<MemoriesNew />} />
                    <Route path="/memories/:id" element={<MemoryDetail />} />
                    <Route path="/health" element={<HealthIndex />} />
                    <Route path="/health/growth/new" element={<GrowthNew />} />
                    <Route path="/health/illness/new" element={<IllnessNew />} />
                    <Route path="/print" element={<Print />} />
                    <Route path="/medications" element={<MedicationsIndex />} />
                    <Route path="/medications/new" element={<MedicationsNew />} />
                    <Route path="/medications/:id" element={<MedicationsDetail />} />
                    <Route path="/medications/:id/dose" element={<DoseNew />} />
                    <Route path="/family" element={<FamilyIndex />} />
                    <Route path="/family/new" element={<FamilyNew />} />
                    <Route path="/family/:id" element={<FamilyDetail />} />
                    <Route path="/counsel" element={<Counsel />} />
                    <Route path="/invitations" element={<Invitations />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/about" element={<About />} />
                  </Route>
                </Route>
              </Route>

              <Route path="/" element={<Navigate to="/today" replace />} />
              <Route path="*" element={<Navigate to="/today" replace />} />
            </Routes>

            {/* Always mounted — opens on hamburger tap from anywhere with a book. */}
            <MenuOverlay />
          </MenuProvider>
        </BookProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
