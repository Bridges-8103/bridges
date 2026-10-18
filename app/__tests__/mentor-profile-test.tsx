import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { Alert, type AlertButton } from 'react-native';

import MentorProfileScreen from '@/app/mentor-profile';
import { createProfile, getProfile, updateProfile } from '@/services/profile/api';
import type { UserProfile } from '@/services/profile/types';

jest.mock('@/services/profile/api', () => ({
  getProfile: jest.fn(),
  createProfile: jest.fn(),
  updateProfile: jest.fn(),
}));

const mockRouter = {
  back: jest.fn(),
  canGoBack: jest.fn(() => true),
  push: jest.fn(),
  replace: jest.fn(),
};
let mockParams: { role?: string; isNew?: string; name?: string } = {};

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockParams,
}));

const mockUpdateRole = jest.fn(() => Promise.resolve());
let mockUser: { id: string; name: string; email: string; role?: 'STUDENT' | 'MENTOR' };

jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({ user: mockUser, updateRole: mockUpdateRole }),
}));

// ProfileAvatar reads the Clerk user directly for its image.
jest.mock('@clerk/expo', () => ({
  useUser: () => ({ user: null }),
}));

const mockedGetProfile = jest.mocked(getProfile);
const mockedCreateProfile = jest.mocked(createProfile);
const mockedUpdateProfile = jest.mocked(updateProfile);
const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

function buildProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 'prof_1',
    userId: 'usr_1',
    displayName: 'Ada Lovelace',
    role: 'MENTOR',
    bio: 'Mentoring engineers for a decade.',
    studentDetail: null,
    mentorDetail: {
      jobTitle: 'Staff Engineer',
      company: 'Atlassian',
      industry: 'Developer Tools',
      yearsExperience: 12,
      expertise: ['System Design', 'Career Growth'],
      preferredEnquiries: [],
      linkedinUrl: 'linkedin.com/in/ada',
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    ...overrides,
  };
}

async function renderScreen() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });

  await render(<MentorProfileScreen />, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });
}

/** Simulates tapping a button on the most recent native Alert. */
function pressAlertButton(text: string) {
  const buttons = alertSpy.mock.lastCall?.[2] as AlertButton[] | undefined;
  const button = buttons?.find((b) => b.text === text);
  if (!button) {
    throw new Error(`Alert button "${text}" was not shown`);
  }
  button.onPress?.();
}

beforeEach(() => {
  jest.clearAllMocks();
  mockedGetProfile.mockReset();
  mockedCreateProfile.mockReset();
  mockedUpdateProfile.mockReset();
  mockParams = {};
  mockUser = { id: 'usr_1', name: 'Jamie Chen', email: 'jamie@bridges.app' };
});

describe('MentorProfileScreen', () => {
  describe('loading and error states', () => {
    it('renders neither the form nor the error card while the profile is loading', async () => {
      mockedGetProfile.mockReturnValue(new Promise(() => {}));

      await renderScreen();

      expect(screen.queryByText('Finish Setup')).toBeNull();
      expect(screen.queryByText('Save Changes')).toBeNull();
      expect(screen.queryByText('Cannot fetch profile')).toBeNull();
    });

    it('shows the fetch error instead of the onboarding form, and retries on demand', async () => {
      mockedGetProfile
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockResolvedValueOnce(null);

      await renderScreen();

      expect(await screen.findByText('Cannot fetch profile')).toBeOnTheScreen();
      expect(screen.getByText('Network Error')).toBeOnTheScreen();
      expect(screen.queryByText('Finish Setup')).toBeNull();

      await fireEvent.press(screen.getByText('Retry'));

      expect(await screen.findByText('Complete your student profile')).toBeOnTheScreen();
      expect(mockedGetProfile).toHaveBeenCalledTimes(2);
    }, 10000);
  });

  describe('creating a new profile', () => {
    beforeEach(() => {
      mockedGetProfile.mockResolvedValue(null);
    });

    it('defaults to student onboarding prefilled with the signed-in user name', async () => {
      await renderScreen();

      expect(await screen.findByText('Complete your student profile')).toBeOnTheScreen();
      expect(screen.getByText('Step 3 of 3')).toBeOnTheScreen();
      expect(screen.getByDisplayValue('Jamie Chen')).toBeOnTheScreen();
      expect(screen.getByText('Education Background')).toBeOnTheScreen();
      expect(screen.queryByText('Professional Experience')).toBeNull();
      expect(screen.getByText('Finish Setup')).toBeOnTheScreen();
    });

    it('takes the role and name from route params', async () => {
      mockParams = { role: 'mentor', name: 'Sam Rivera' };

      await renderScreen();

      expect(await screen.findByText('Complete your mentor profile')).toBeOnTheScreen();
      expect(screen.getByDisplayValue('Sam Rivera')).toBeOnTheScreen();
      expect(screen.getByText('Professional Experience')).toBeOnTheScreen();
      expect(screen.getByText('Social Links')).toBeOnTheScreen();
      expect(screen.queryByText('Education Background')).toBeNull();
    });

    it("falls back to the signed-in user's role when no param is given", async () => {
      mockUser = { ...mockUser, role: 'MENTOR' };

      await renderScreen();

      expect(await screen.findByText('Complete your mentor profile')).toBeOnTheScreen();
    });

    it('swaps the role-specific sections when the role is toggled', async () => {
      await renderScreen();
      await screen.findByText('Complete your student profile');

      await fireEvent.press(screen.getByText('Mentor'));

      expect(screen.getByText('Complete your mentor profile')).toBeOnTheScreen();
      expect(screen.getByText('Professional Experience')).toBeOnTheScreen();
      expect(screen.queryByText('Education Background')).toBeNull();

      await fireEvent.press(screen.getByText('Student'));

      expect(screen.getByText('Education Background')).toBeOnTheScreen();
      expect(screen.queryByText('Professional Experience')).toBeNull();
    });

    it('blocks submission when the name is blank', async () => {
      await renderScreen();
      await screen.findByText('Finish Setup');

      await fireEvent.changeText(screen.getByPlaceholderText('Your name'), '   ');
      await fireEvent.press(screen.getByText('Finish Setup'));

      expect(alertSpy).toHaveBeenCalledWith('Missing Name', 'Please provide your full name.');
      expect(mockedCreateProfile).not.toHaveBeenCalled();
    });

    it('removes a tag locally without calling the API', async () => {
      await renderScreen();
      await screen.findByText('Python');

      await fireEvent.press(screen.getByLabelText('Remove Python'));

      expect(screen.queryByText('Python')).toBeNull();
      expect(screen.getByText('Data Analysis')).toBeOnTheScreen();
      expect(mockedUpdateProfile).not.toHaveBeenCalled();
    });

    it('creates a student profile with only student fields', async () => {
      mockedCreateProfile.mockResolvedValue(buildProfile({ role: 'STUDENT' }));

      await renderScreen();
      await screen.findByText('Finish Setup');

      await fireEvent.changeText(screen.getByPlaceholderText('Your name'), '  Jamie Chen  ');
      await fireEvent.changeText(
        screen.getByPlaceholderText(/Share your background, interests/),
        '  Aspiring ML engineer.  '
      );
      await fireEvent.changeText(
        screen.getByPlaceholderText('e.g. Software Engineer, Product Designer'),
        'AI Researcher'
      );
      await fireEvent.press(screen.getByText('Year 3'));
      await fireEvent.press(screen.getByText('Year 2'));
      await fireEvent.press(screen.getByText('Finish Setup'));

      await waitFor(() => expect(mockedCreateProfile).toHaveBeenCalledTimes(1));
      // toEqual ignores undefined keys, so this also asserts no mentor fields are sent.
      expect(mockedCreateProfile.mock.calls[0][0]).toEqual({
        userId: 'usr_1',
        email: 'jamie@bridges.app',
        displayName: 'Jamie Chen',
        role: 'STUDENT',
        bio: 'Aspiring ML engineer.',
        university: 'University of Adelaide',
        degree: 'Computer Science',
        fieldOfStudy: 'Computer Science',
        yearOfStudy: 2,
        skills: ['Python', 'Data Analysis'],
        interests: ['Artificial Intelligence', 'Machine learning'],
        careerGoals: 'AI Researcher',
      });

      await waitFor(() =>
        expect(alertSpy).toHaveBeenCalledWith(
          'Welcome to Bridges!',
          'Your profile has been created successfully.',
          expect.any(Array)
        )
      );
      expect(mockUpdateRole).toHaveBeenCalledWith('STUDENT');

      pressAlertButton('Get Started');
      expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)');
    });

    it('creates a mentor profile with only mentor fields', async () => {
      mockParams = { role: 'MENTOR' };
      mockedCreateProfile.mockResolvedValue(buildProfile());

      await renderScreen();
      await screen.findByText('Finish Setup');

      await fireEvent.changeText(
        screen.getByPlaceholderText('e.g. Senior Software Engineer'),
        'Engineering Manager'
      );
      await fireEvent.changeText(screen.getByPlaceholderText('e.g. Google, Atlassian'), 'Canva');
      await fireEvent.changeText(screen.getByPlaceholderText('5'), '8 yrs');
      await fireEvent.changeText(
        screen.getByPlaceholderText('linkedin.com/in/username'),
        '  linkedin.com/in/jamie  '
      );
      await fireEvent.press(screen.getByText('Finish Setup'));

      await waitFor(() => expect(mockedCreateProfile).toHaveBeenCalledTimes(1));
      expect(mockedCreateProfile.mock.calls[0][0]).toEqual({
        userId: 'usr_1',
        email: 'jamie@bridges.app',
        displayName: 'Jamie Chen',
        role: 'MENTOR',
        bio: '',
        jobTitle: 'Engineering Manager',
        company: 'Canva',
        industry: 'Technology & Software',
        yearsExperience: 8,
        expertise: ['Artificial Intelligence', 'Software Engineering'],
        linkedinUrl: 'linkedin.com/in/jamie',
      });
      await waitFor(() => expect(mockUpdateRole).toHaveBeenCalledWith('MENTOR'));
    });
  });

  describe('editing an existing profile', () => {
    it('prefills the mentor form from the saved profile', async () => {
      mockedGetProfile.mockResolvedValue(buildProfile());

      await renderScreen();

      expect(await screen.findByText('Edit your mentor profile')).toBeOnTheScreen();
      expect(screen.getByDisplayValue('Ada Lovelace')).toBeOnTheScreen();
      expect(screen.getByDisplayValue('Mentoring engineers for a decade.')).toBeOnTheScreen();
      expect(screen.getByDisplayValue('Staff Engineer')).toBeOnTheScreen();
      expect(screen.getByDisplayValue('Atlassian')).toBeOnTheScreen();
      expect(screen.getByDisplayValue('Developer Tools')).toBeOnTheScreen();
      expect(screen.getByDisplayValue('12')).toBeOnTheScreen();
      expect(screen.getByDisplayValue('linkedin.com/in/ada')).toBeOnTheScreen();
      expect(screen.getByText('System Design')).toBeOnTheScreen();
      expect(screen.getByText('Save Changes')).toBeOnTheScreen();
      expect(screen.queryByText('Step 3 of 3')).toBeNull();
    });

    it('prefills the student form from the saved profile', async () => {
      mockedGetProfile.mockResolvedValue(
        buildProfile({
          role: 'STUDENT',
          mentorDetail: null,
          studentDetail: {
            university: 'UNSW',
            yearOfStudy: 4,
            fieldOfStudy: 'Mathematics',
            skills: ['R'],
            interests: ['Statistics'],
            careerGoals: 'Quant Analyst',
          },
        })
      );

      await renderScreen();

      expect(await screen.findByText('Edit your student profile')).toBeOnTheScreen();
      expect(screen.getByDisplayValue('UNSW')).toBeOnTheScreen();
      expect(screen.getByText('Year 4')).toBeOnTheScreen();
      expect(screen.getByText('Mathematics')).toBeOnTheScreen();
      expect(screen.getByDisplayValue('Quant Analyst')).toBeOnTheScreen();
      expect(screen.getByText('R')).toBeOnTheScreen();
      expect(screen.getByText('Statistics')).toBeOnTheScreen();
    });

    it('saves changes against the existing profile id', async () => {
      mockedGetProfile.mockResolvedValue(buildProfile());
      mockedUpdateProfile.mockResolvedValue(
        buildProfile({ updatedAt: '2026-01-03T00:00:00.000Z' })
      );

      await renderScreen();
      await screen.findByText('Save Changes');

      await fireEvent.changeText(screen.getByDisplayValue('Atlassian'), 'Canva');
      await fireEvent.press(screen.getByText('Save Changes'));

      await waitFor(() => expect(mockedUpdateProfile).toHaveBeenCalledTimes(1));
      const [input, id] = mockedUpdateProfile.mock.calls[0];
      expect(id).toBe('prof_1');
      expect(input).toEqual({
        displayName: 'Ada Lovelace',
        role: 'MENTOR',
        bio: 'Mentoring engineers for a decade.',
        jobTitle: 'Staff Engineer',
        company: 'Canva',
        industry: 'Developer Tools',
        yearsExperience: 12,
        expertise: ['System Design', 'Career Growth'],
        linkedinUrl: 'linkedin.com/in/ada',
      });

      await waitFor(() =>
        expect(alertSpy).toHaveBeenCalledWith(
          'Profile Updated',
          'Your profile details have been successfully saved.',
          expect.any(Array)
        )
      );
      expect(mockUpdateRole).toHaveBeenCalledWith('MENTOR');

      pressAlertButton('OK');
      expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)/profile');
    });

    it('surfaces the API error message when saving fails', async () => {
      mockedGetProfile.mockResolvedValue(buildProfile());
      mockedUpdateProfile.mockRejectedValue(new Error('Profile service unavailable'));

      await renderScreen();
      await screen.findByText('Save Changes');

      await fireEvent.press(screen.getByText('Save Changes'));

      await waitFor(() =>
        expect(alertSpy).toHaveBeenCalledWith('Error', 'Profile service unavailable')
      );
      expect(mockUpdateRole).not.toHaveBeenCalled();
      expect(mockRouter.replace).not.toHaveBeenCalled();
    });

    it('persists tag removal immediately for a saved profile', async () => {
      mockedGetProfile.mockResolvedValue(buildProfile());
      mockedUpdateProfile.mockResolvedValue(
        buildProfile({ updatedAt: '2026-01-03T00:00:00.000Z' })
      );

      await renderScreen();
      await screen.findByText('System Design');

      await fireEvent.press(screen.getByLabelText('Remove System Design'));

      await waitFor(() =>
        expect(mockedUpdateProfile).toHaveBeenCalledWith(
          { expertise: ['Career Growth'] },
          'prof_1'
        )
      );
    });
  });
});
