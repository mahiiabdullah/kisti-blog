import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppThemeProvider } from "@/components/theme-provider";
import { RequireAdmin } from "@/components/RequireAdmin";
import { AdminLayout } from "@/components/AdminLayout";
import Index from "./pages/Index.tsx";
import PostPage from "./pages/PostPage.tsx";
import Auth from "./pages/Auth.tsx";
import NotFound from "./pages/NotFound.tsx";
import AdminPosts from "./pages/admin/AdminPosts.tsx";
import AdminDashboard from "./pages/admin/AdminDashboard.tsx";
import AdminPostEditor from "./pages/admin/AdminPostEditor.tsx";
import AdminComments from "./pages/admin/AdminComments.tsx";
import AdminMedia from "./pages/admin/AdminMedia.tsx";
import AdminUsers from "./pages/admin/AdminUsers.tsx";
import Profile from "./pages/Profile.tsx";
import SearchResults from "./pages/SearchResults.tsx";
import About from "./pages/About.tsx";
import Contact from "./pages/Contact.tsx";
import Categories from "./pages/Categories.tsx";

const App = () => (
  <AppThemeProvider>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/post/:slug" element={<PostPage />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminLayout />
              </RequireAdmin>
            }
          >
            <Route index element={<AdminPosts />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="posts/new" element={<AdminPostEditor />} />
            <Route path="posts/:id" element={<AdminPostEditor />} />
            <Route path="comments" element={<AdminComments />} />
            <Route path="media" element={<AdminMedia />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </AppThemeProvider>
);

export default App;
