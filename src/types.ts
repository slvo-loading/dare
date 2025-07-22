import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  FriendsList: undefined;
  OtherProfiles: { userId: string };
};

export type MainTabParamList = {
  MatchmakingStack: NavigatorScreenParams<MatchmakingStackParamList>;
  Leaderboard: NavigatorScreenParams<LeaderboardTabsParamList>;
  BattleStack: NavigatorScreenParams<BattleStackParamList>;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

export type OnboardingStackParamList = {
    Step1: undefined;
    Step2: undefined;
    Step3: undefined;
  };

export type MatchmakingStackParamList = {
    HabitSelection: undefined;
    HabitConfig:  { type: string };
    OpponentSelection: undefined;
    InviteFriend: undefined;
    Matchmaking: undefined;
    GameStart: { type: string; opponentId: string; };
}

export type BattleStackParamList = {
    BattleScreen: undefined;
    ResponseScreen: { battleId: string; turn: boolean; };
    SubmitScreen: { battleId: string; };
}

export type LeaderboardTabsParamList = {
    FriendsBoard: undefined;
    GlobalBoard: undefined;
    OtherProfiles: { userId: string };
}

export type ProfileStackParamList = {
    ProfileScreen: undefined;
    EditProfileScreen: undefined;
    FriendsList: undefined;
    Settings: undefined;
}


export type RootStackScreenProps<T extends keyof RootStackParamList> = 
  NativeStackScreenProps<RootStackParamList, T>;

export type OnboardingStackProps<T extends keyof OnboardingStackParamList> = 
NativeStackScreenProps<OnboardingStackParamList, T>;

export type TabScreenProps<T extends keyof MainTabParamList> = 
  BottomTabScreenProps<MainTabParamList, T>;

export type MatchmakingStackProps<T extends keyof MatchmakingStackParamList> = 
  CompositeScreenProps<
    NativeStackScreenProps<MatchmakingStackParamList, T>,
    NativeStackScreenProps<RootStackParamList>
  >;

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
  BottomTabScreenProps<ProfileStackParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

export type GameStartScreenProps = CompositeScreenProps<
  NativeStackScreenProps<MatchmakingStackParamList, 'GameStart'>,
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList>,
    NativeStackScreenProps<RootStackParamList>
  >
>;
