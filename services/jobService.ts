import { apiRequest } from './api';
import { API_ENDPOINTS } from '../constants/API_Endpoints';
import { ApiResponse, JobResponse, PagedJobResponse, CreateJobData, UpdateJobData } from '../types';

// Utility to check if backend is offline in DEV mode
const isBackendOffline = (res: ApiResponse<any>) => {
  if (!__DEV__) return false;
  const offlineMessages = [
    'network error',
    'timeout',
    'enotfound',
    'econnrefused',
    'network request failed',
    'api request failed'
  ];
  const msg = (res.message || '').toLowerCase();
  return offlineMessages.some(m => msg.includes(m)) || !res.message;
};

// In-memory mock database for offline DEV mode
let devMockJobs: JobResponse[] = [
  {
    id: 'job_1',
    title: 'Computer Lab Assistant',
    company: 'Faculty of Computing',
    location: 'Main Lab Complex, SUSL',
    payRange: 'Rs. 500/hr',
    jobType: 'Part-Time',
    category: 'Campus',
    logo: null,
    description: 'Assist students with logging in, managing printing systems, and keeping lab workspaces tidy.',
    longDescription: 'The Faculty of Computing is seeking a reliable Computer Lab Assistant to support student lab sessions. Tasks include helping peers resolve basic lab hardware/software issues, keeping printer sheets loaded, monitoring lab reservation calendars, and reporting hardware issues to the IT staff. Excellent communication and basic troubleshooting skills are required.',
    requirements: ['SUSL undergraduate', 'Basic software installation knowledge', 'Punctual & friendly', 'Minimum 10 hours/week commitment'],
    tags: ['Academic', 'IT Support', 'On-Campus'],
    isNew: true,
    postedBy: {
      userId: 'user_98371',
      name: 'Dr. Chandika Perera',
      email: 'cperera@computing.susl.lk',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150',
      mobileNumber: '0712345670'
    },
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
  },
  {
    id: 'job_2',
    title: 'Content Writer Helper',
    company: 'Student Union Hub',
    location: 'Student Union Office, SUSL',
    payRange: 'Rs. 4,000/gig',
    jobType: 'Freelance',
    category: 'Marketing',
    logo: null,
    description: 'Write engaging captions, newsletter drafts, and event bulletins for student activities.',
    longDescription: 'Join the Student Union media crew to draft text materials for upcoming sports meets, cultural activities, and university news. The role offers maximum flexibility as you can work entirely from your boarding room or the library. We need someone with excellent written English skills and a creative storytelling capability.',
    requirements: ['Strong command of written English', 'Familiarity with SUSL campus activities', 'Access to a personal computer', 'Ability to meet tight deadlines'],
    tags: ['Creative', 'Writing', 'Flexi-Time'],
    isNew: true,
    postedBy: {
      userId: 'user_98372',
      name: 'Sachintha Bandara',
      email: 'su.president@susl.lk',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150',
      mobileNumber: '0779876540'
    },
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(), // 8 hours ago
  },
  {
    id: 'job_3',
    title: 'Campus Cafe Barista',
    company: 'Central Canteen',
    location: 'Central Canteen Complex, SUSL',
    payRange: 'Rs. 350/hr + Meals',
    jobType: 'Part-Time',
    category: 'Food & Bev',
    logo: null,
    description: 'Help brew coffee, serve fresh snacks, and manage billing register during peak lunch hours.',
    longDescription: 'The Central Canteen Cafe is hiring student baristas to support the daily coffee/juice counters during the busy morning and midday rushes. You will learn basic beverage preparation, manage cash registers, and deliver polite service to peers and faculty staff. Includes one free healthy meal per shift.',
    requirements: ['Customer service mindset', 'Clean and tidy hygiene habits', 'Basic cash register handling', 'Available during 11:00 AM - 2:00 PM'],
    tags: ['Service', 'F&B', 'Free Meals'],
    isNew: false,
    postedBy: {
      userId: 'user_98373',
      name: 'M. R. Gunawardena',
      email: 'canteen.mgr@nearusab.me',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150',
      mobileNumber: '0751122334'
    },
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
  },
  {
    id: 'job_4',
    title: 'Exam Proctor Helper',
    company: 'SUSL Administration',
    location: 'Exam Hall A & B',
    payRange: 'Rs. 600/hr',
    jobType: 'Part-Time',
    category: 'Campus',
    logo: null,
    description: 'Assist professors with layout setup, paper distribution, and exam hall monitoring.',
    longDescription: 'Temporary student assistants needed for the upcoming semester examinations. Assistants will work under the supervision of the Chief Invigilator to arrange exam desks, verify student identity cards at entry doors, distribute exam scripts, and ensure examination hall code of conduct is strictly maintained.',
    requirements: ['Must be in 3rd or 4th year', 'Clean academic record (no active disciplinaries)', 'High integrity & detail oriented'],
    tags: ['Admin', 'Short-Term', 'Flexible'],
    isNew: false,
    postedBy: {
      userId: 'user_98374',
      name: 'Mrs. Jayasinghe',
      email: 'admin.exams@susl.lk',
      avatar: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?q=80&w=150',
      mobileNumber: '0714455667'
    },
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(), // 2 days ago
  },
  {
    id: 'job_5',
    title: 'Graphic Design Intern',
    company: 'NearU App Team',
    location: 'Remote / Belihuloya',
    payRange: 'Rs. 15,000/mo',
    jobType: 'Internship',
    category: 'Tech',
    logo: null,
    description: 'Create social media posts, poster illustrations, and design elements for the NearU platform.',
    longDescription: 'NearU is looking for a creative graphic design intern to draft visual banners, promotions, and ui illustrations for our student services app. You will work directly with our engineering and marketing leads to craft a premium, unified brand image. High-performing interns will be considered for full-time offers.',
    requirements: ['Proficient in Canva or Figma', 'Strong portfolio of graphic layouts', 'Self-motivated remote worker', 'SUSL undergraduate student'],
    tags: ['Design', 'Figma', 'NearU Team', 'Remote'],
    isNew: false,
    postedBy: {
      userId: 'admin_nearu',
      name: 'NearU Admin Team',
      email: 'admin@nearu.com',
      avatar: null,
      mobileNumber: '0710001112'
    },
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(), // 3 days ago
  }
];

export const jobService = {
  getAllJobs: async (page: number = 1, pageSize: number = 10): Promise<ApiResponse<PagedJobResponse>> => {
    try {
      const res = await apiRequest.get<any>(`${API_ENDPOINTS.JOBS.LIST}?page=${page}&pageSize=${pageSize}`);
      if (res.success && res.data) {
        // Guard against old flat arrays from old backend envelope
        const envelope = res.data as any;
        const raw = envelope.data || envelope;
        
        if (Array.isArray(raw)) {
          return {
            success: true,
            data: {
              items: raw,
              totalCount: raw.length,
              totalPages: 1,
              currentPage: 1,
              pageSize: raw.length,
            }
          };
        }
        
        return { success: true, data: raw };
      }

      if (__DEV__ && isBackendOffline(res)) {
        console.warn('Backend offline. Loading mock job listings.');
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Paginate mock database
        const start = (page - 1) * pageSize;
        const items = devMockJobs.slice(start, start + pageSize);
        const totalCount = devMockJobs.length;
        const totalPages = Math.ceil(totalCount / pageSize);

        return {
          success: true,
          data: {
            items,
            totalCount,
            totalPages,
            currentPage: page,
            pageSize,
          }
        };
      }

      return { success: false, message: res.message || 'Failed to fetch job opportunities.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'An unexpected networking failure occurred.' };
    }
  },

  getNewJobs: async (): Promise<ApiResponse<JobResponse[]>> => {
    try {
      const res = await apiRequest.get<any>(API_ENDPOINTS.JOBS.NEW);
      if (res.success && res.data) {
        const envelope = res.data as any;
        return { success: true, data: envelope.data || envelope };
      }

      if (__DEV__ && isBackendOffline(res)) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const newJobs = devMockJobs.filter(j => j.isNew);
        return { success: true, data: newJobs };
      }

      return { success: false, message: res.message || 'Failed to fetch new jobs.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'An unexpected networking failure occurred.' };
    }
  },

  createJob: async (data: CreateJobData, currentUser: any): Promise<ApiResponse<JobResponse>> => {
    try {
      const res = await apiRequest.post<any>(API_ENDPOINTS.JOBS.CREATE, data);
      if (res.success && res.data) {
        const envelope = res.data as any;
        return { success: true, data: envelope.data || envelope };
      }

      if (__DEV__ && isBackendOffline(res)) {
        console.warn('Backend offline. Simulating job listing creation locally.');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const newJob: JobResponse = {
          id: 'job_' + Math.floor(Math.random() * 900000 + 100000),
          title: data.title,
          company: data.company,
          location: data.location,
          payRange: data.payRange,
          jobType: data.jobType,
          category: data.category,
          logo: data.logo || null,
          description: data.description,
          longDescription: data.longDescription || data.description,
          requirements: data.requirements || [],
          tags: data.tags || [],
          isNew: true,
          postedBy: {
            userId: currentUser?.id || 'user_98371',
            name: `${currentUser?.firstName || 'Guest'} ${currentUser?.lastName || 'User'}`,
            email: currentUser?.email || 'student@nearu.lk',
            avatar: currentUser?.avatarUrl || null,
            mobileNumber: currentUser?.mobileNumber || '0712345678'
          },
          createdAt: new Date().toISOString(),
        };

        // Insert at index 0 of local mock DB
        devMockJobs.unshift(newJob);
        return { success: true, data: newJob };
      }

      return { success: false, message: res.message || 'Failed to submit job listing.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'An unexpected networking failure occurred.' };
    }
  },

  updateJob: async (id: string, data: UpdateJobData): Promise<ApiResponse<JobResponse>> => {
    try {
      const res = await apiRequest.put<any>(API_ENDPOINTS.JOBS.UPDATE(id), data);
      if (res.success && res.data) {
        const envelope = res.data as any;
        return { success: true, data: envelope.data || envelope };
      }

      if (__DEV__ && isBackendOffline(res)) {
        console.warn('Backend offline. Simulating job listing update locally.');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const jobIndex = devMockJobs.findIndex(j => j.id === id);
        if (jobIndex > -1) {
          const updatedJob = {
            ...devMockJobs[jobIndex],
            ...data,
            // Guard nested properties if string arrays
            requirements: data.requirements !== undefined ? data.requirements : devMockJobs[jobIndex].requirements,
            tags: data.tags !== undefined ? data.tags : devMockJobs[jobIndex].tags,
          } as JobResponse;
          
          devMockJobs[jobIndex] = updatedJob;
          return { success: true, data: updatedJob };
        }
        return { success: false, message: 'Listing not found in mock database.' };
      }

      return { success: false, message: res.message || 'Failed to update job listing.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'An unexpected networking failure occurred.' };
    }
  },

  deleteJob: async (id: string): Promise<ApiResponse<void>> => {
    try {
      const res = await apiRequest.delete<any>(API_ENDPOINTS.JOBS.DELETE(id));
      if (res.success) {
        return { success: true };
      }

      if (__DEV__ && isBackendOffline(res)) {
        console.warn('Backend offline. Simulating job listing deletion locally.');
        await new Promise(resolve => setTimeout(resolve, 800));
        devMockJobs = devMockJobs.filter(j => j.id !== id);
        return { success: true };
      }

      return { success: false, message: res.message || 'Failed to delete job listing.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'An unexpected networking failure occurred.' };
    }
  }
};
