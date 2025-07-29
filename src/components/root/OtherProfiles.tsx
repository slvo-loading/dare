import { View, Text } from "react-native";
import { useRoute, RouteProp } from '@react-navigation/native';

type OtherProfilesRouteParams = {
    userId: string;
};
  
type OtherProfilesRouteProp = RouteProp<
    { OtherProfiles: OtherProfilesRouteParams },
    'OtherProfiles'
>;

export default function OtherProfiles() {
  const route = useRoute<OtherProfilesRouteProp>();
  const { userId } = route.params;
  return (
    <View>
      <Text>other Profiles {userId}</Text>
    </View>
  );
}