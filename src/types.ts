import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  FriendsList: { userId: string };
  OtherProfiles: { userId: string };
};

export type MainTabParamList = {
  Leaderboard: NavigatorScreenParams<LeaderboardTabsParamList>;
  BattleStack: NavigatorScreenParams<BattleStackParamList>;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

export type OnboardingStackParamList = {
    Step1: undefined;
    Step2: undefined;
    Step3: undefined;
  };

export type AuthStackParamList = {
  Login: undefined;
}

type NewSubmission = {
  type: string;
  uri: string;
}

type Completed = 
{
  battleId: string;
  opponentId: string;
  opponentName: string,
  avatarUrl: string,
  status: string, 
  winner: string,
  startDate: any,
  endDate: any,
}

type Battle = 
{
  battleId: string;
  opponentId: string;
  opponentUserName: string,
  opponentName: string,
  avatarUrl: string,
  users_dare: string,
  status: string, 
  coins: number,
}

export type BattleStackParamList = {
    BattleScreen: undefined;
    ResponseScreen: { battleId: string; dare: string; };
    SubmitScreen: { uri: NewSubmission[]; battleId: string; dare: string; caption: string | null, };
    DraftPickScreen: { battleId: string; dare: string; };
    ResultScreen: { battle: Completed;};
    HabitConfig: { type: string; battle: Battle | null; };
    OpponentSelection: undefined;
    InviteFriend: { dare: string, coins: number};
    Matchmaking: { dare: { userName: string, userId: string, dare: string, coins: number, avatarUrl: string, name: string,}};
    GameStart: { type: string; match: { opponentName: string, opponentId: string, opponentAvatar: string; dare: string, opponentUserName: string} };
}

export type LeaderboardTabsParamList = {
    FriendsBoard: undefined;
    GlobalBoard: undefined;
    OtherProfiles: { userId: string };
}

export type ProfileStackParamList = {
    ProfileScreen: undefined;
    EditProfileScreen: { 
      userProfile: {
        userName: string | undefined;
        avatarUrl: string | undefined;
        name: string | undefined;
        bio: string | undefined;
      },
  };
    FriendsList: { userId: string };
    OtherProfiles: { userId: string };
    Settings: undefined;
    CropScreen: { imageUri: string; battle: PinnedBattle | null;  };
    AddInterests: undefined;
    EditInterest: { interestId: string; caption: string; imageUrl: {type: string; uri: string}[]; };
    EditPin: {battle: PinnedBattle;};
    AllReportsScreen: undefined;
}

type Report = {
  id: string;
  details: string;
  reason: string;
  status: string;
  coins: number;
  createdAt: string;
  reporter: string;
  reported: { id: string, dare: string };
}

type PinnedBattle = {
  id: string;
  title: string;
  thumbnail: string;
}

export type RootStackScreenProps<T extends keyof RootStackParamList> = 
  NativeStackScreenProps<RootStackParamList, T>;

export type OnboardingStackProps<T extends keyof OnboardingStackParamList> = 
NativeStackScreenProps<OnboardingStackParamList, T>;

export type TabScreenProps<T extends keyof MainTabParamList> = 
  BottomTabScreenProps<MainTabParamList, T>;

  export type BattleStackProps<T extends keyof BattleStackParamList> = 
  CompositeScreenProps<
    NativeStackScreenProps<BattleStackParamList, T>,
    NativeStackScreenProps<RootStackParamList>
  >;

  export type LeaderboardProps<T extends keyof LeaderboardTabsParamList> = 
  CompositeScreenProps<
    BottomTabScreenProps<LeaderboardTabsParamList, T>,
    NativeStackScreenProps<RootStackParamList>
  >;

export type ProfileStackProps<T extends keyof ProfileStackParamList> = 
CompositeScreenProps<
  NativeStackScreenProps<ProfileStackParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

export type GameStartScreenProps = CompositeScreenProps<
  NativeStackScreenProps<BattleStackParamList, 'GameStart'>,
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList>,
    NativeStackScreenProps<RootStackParamList>
  >
>;

export type LoginScreenProps = CompositeScreenProps<
  NativeStackScreenProps<AuthStackParamList, 'Login'>,
  NativeStackScreenProps<RootStackParamList>
>;