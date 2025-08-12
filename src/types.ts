import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  FriendsList: undefined;
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

export type BattleStackParamList = {
    BattleScreen: undefined;
    ResponseScreen: { battleId: string; dare: string; gameMode: string };
    SubmitScreen: { uri: NewSubmission[]; battleId: string; dare: string; gameMode: string; caption: string | null, draft: boolean};
    DraftPickScreen: { battleId: string; dare: string; gameMode: string };

    HabitConfig:  { type: string; };
    OpponentSelection: undefined;
    InviteFriend: { dare: string, gameMode: string};
    Matchmaking: { dare: { userName: string, userId: string, dare: string }, gameMode: string};
    GameStart: { type: string; match: { opponentName: string, opponentId: string, dare: string} };
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
    FriendsList: undefined;
    Settings: undefined;
    CropScreen: { imageUri: string; };
    AddInterests: undefined;
    EditInterest: { interestId: string; caption: string; imageUri: string[]; };
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