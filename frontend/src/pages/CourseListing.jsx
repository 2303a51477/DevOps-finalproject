import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Search, 
  Clock, 
  Award, 
  CheckCircle2, 
  Layers, 
  ArrowRight, 
  Filter,
  GraduationCap
} from 'lucide-react';
import { courseService } from '../services/courseService';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/Modal';

export const CourseListing = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');

  const categories = [
    'all',
    'Cloud & DevOps',
    'Web Development',
    'Cybersecurity',
    'AI & Data Science',
  ];

  const difficulties = ['all', 'Beginner', 'Intermediate', 'Advanced'];

  const loadCourses = async () => {
    setLoading(true);
    try {
      const data = await courseService.getCourses({
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        difficulty: selectedDifficulty !== 'all' ? selectedDifficulty : undefined,
        search: search || undefined,
        status_filter: 'approved'
      });
      setCourses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, [selectedCategory, selectedDifficulty]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadCourses();
  };

  return (
    <div className="space-y-8">
      {/* Catalog Banner */}
      <div className="bg-gradient-to-r from-sky-600 via-sky-700 to-sky-900 rounded-3xl p-8 text-white shadow-md">
        <div className="max-w-3xl">
          <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-sm">
            Accredited Academic Registry
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-3">
            Explore Certified Course Curricula
          </h1>
          <p className="text-sm text-sky-100 mt-2 leading-relaxed">
            Enroll in industry-verified curriculum programs designed by top institutions. Complete technical assessments to earn cryptographically verifiable digital credentials.
          </p>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search course title, syllabus modules, or technologies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:bg-white text-slate-900"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-sm transition-colors"
          >
            Search Catalog
          </button>
        </form>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-3 border-t border-slate-100">
          {/* Categories */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-semibold mr-1">Category:</span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  selectedCategory === cat
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat === 'all' ? 'All Disciplines' : cat}
              </button>
            ))}
          </div>

          {/* Difficulty */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-semibold mr-1">Difficulty:</span>
            {difficulties.map((diff) => (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                className={`px-2.5 py-1 rounded-lg font-semibold capitalize transition-all ${
                  selectedDifficulty === diff
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {diff === 'all' ? 'Any' : diff}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Course Grid */}
      {loading ? (
        <LoadingSpinner text="Searching course catalog..." />
      ) : courses.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No courses match your criteria</h3>
          <p className="text-xs text-slate-500 mt-1">Try resetting filters or searching with different keywords.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group"
            >
              {/* Thumbnail */}
              <div className="h-44 bg-slate-100 relative overflow-hidden">
                <img
                  src={course.thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80'}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-3 left-3 px-2.5 py-1 text-[10px] font-bold uppercase rounded-md bg-white/95 backdrop-blur text-slate-800 shadow-sm">
                  {course.category}
                </span>
                <span className="absolute top-3 right-3 px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-sky-600 text-white shadow-sm">
                  {course.difficulty}
                </span>
              </div>

              {/* Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-sky-600 mb-1">
                    {course.provider?.organization || course.provider?.name || 'Accredited Academy'}
                  </p>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-1 mb-2">
                    {course.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {course.duration_hours} Hours
                    </span>
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      {course.modules?.length || 0} Modules
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-emerald-600">
                      <Award className="w-3.5 h-3.5" />
                      {course.passing_percentage}% Pass
                    </span>
                  </div>

                  <Link
                    to={`/courses/${course.id}`}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-sky-600 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
                  >
                    <span>View Curriculum & Enroll</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseListing;
