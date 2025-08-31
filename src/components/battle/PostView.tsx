import React, { useState, useEffect, useRef,} from "react";
import { SafeAreaView, View, Image, Dimensions, Text, Modal,
  ActivityIndicator, FlatList, Button, TextInput, StyleSheet, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { collection, getDocs, query, orderBy, where, Timestamp, runTransaction, doc } from "firebase/firestore";
import { db } from "../../../firebaseConfig"; 
import { Video } from "expo-av";
import { Dropdown } from "react-native-element-dropdown";
import { useAuth } from "../../context/AuthContext";

const { width, height } = Dimensions.get('window');

type Submission = {
    id: string;
    caption: string;
    media: Media[];
    user_id?: string;
    submitted_at?: string;
  }

type Media = {
  type: string;
  uri: string;
  // muted: boolean;
}

type Interests = {
  id: string;
  caption: string;
  imageUrl: Media[];
  createdAt: string;
}

const reportReasons = [
  { label: "Inappropriate Content", value: "inappropriate" },
  { label: "Hate Speech or Harassment", value: "harassment" },
  { label: "Misinformation", value: "misinformation" },
  { label: "Spam or Scams", value: "spam" },
  { label: "Violence or Threats", value: "violence" },
  { label: "Copyright Violation", value: "copyright" },
  { label: "Other", value: "other" },
];

export default function PostView({ 
  battleId, 
  dare,
  type,
  interests,
  startIndex,
  userId,
} : { 
  battleId?: string,
  dare?: string,
  type?: string,
  interests?: Interests[],
  startIndex?: number,
  userId: string,
}) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const flatListRef = useRef<FlatList>(null); 
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [details, setDetails] = useState<string>('');
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (type === 'ongoing_game') {
      fetchSubmissions();
    } else if (type === 'pinned') {
      fetchSelectedGame();
    } else if (type === 'interests') {
      setSubmissions(
        interests?.
        map(interest => ({
          id: interest.id,
          caption: interest.caption,
          media: interest.imageUrl,
          submitted_at: interest.createdAt,
        })) || [])
    }
    setLoading(false);
  }, [battleId]);


  // this is for an ongoing game, will show all submissions for that game
  const fetchSubmissions = async () => {
    if (!battleId) return;
        const submissionRef = collection(db, 'games', battleId, 'submissions');
        const q = query(submissionRef, orderBy("submitted_at", "desc"));
        const snapshot = await getDocs(q);
  
        const submissionsData: Submission[] = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            submissionsData.push({
            id: doc.id,
            caption: data.caption,
            user_id: data.user_id,
            media: data.media,
            submitted_at: data.submitted_at.toDate().toISOString()
            })
        });
  
        setSubmissions(submissionsData);
    }


    // pinned games, can only see ur own submissions
    const fetchSelectedGame = async () => {
      if (!userId || !battleId) return;
      try {
        console.log('Fetching selected game:', battleId);
        const q = query(collection(db, 'games', battleId, 'submissions'), 
          where('user_id', '==', userId), orderBy("submitted_at", "desc"));
        const snap = await getDocs(q);
  
        const submissions: Submission[] = [];
        snap.forEach(doc => {
          const data = doc.data();
          submissions.push({
            id: doc.id,
            caption: data.caption,
            media: data.media,
            submitted_at: data.submitted_at.toDate().toISOString()
          })
        });
  
        setSubmissions(submissions);
  
      } catch (error) {
        console.error('Error fetching selected game:', error);
      }
    }

    const [horizontalIndex, setHorizontalIndex] = useState(0);
    const [verticalIndex, setVerticalIndex] = useState(0);
    
    const onHorizontalItemsChanged = useRef(({ viewableItems } : { viewableItems: any}) => {
      if (viewableItems.length > 0) {
        setHorizontalIndex(viewableItems[0].index); // first visible item
      }
    }).current;
        
    const onVerticalItemsChanged = useRef(({ viewableItems } : { viewableItems: any}) => {
      if (viewableItems.length > 0) {
        setVerticalIndex(viewableItems[0].index); // first visible item
      }
    }).current;

    const viewabilityConfig = {
      itemVisiblePercentThreshold: 75, // Trigger when 50% of the item is visible
    };

  
    const reportUser = async () => {
      console.log("Submitting report...");
      if ( !user) return;
    
      const reporterRef = doc(db, "users", user.uid);
      const reportedRef = doc(db, "users", userId);
    
      try {
        await runTransaction(db, async (transaction) => {
          // Get current balances
          const reporterSnap = await transaction.get(reporterRef);
          const reportedSnap = await transaction.get(reportedRef);
    
          if (!reporterSnap.exists()) throw new Error("Reporter not found");
          if (!reportedSnap.exists()) throw new Error("Reported user not found");
    
          const reporterData = reporterSnap.data();
          const reportedData = reportedSnap.data();
    
          const reportsRef = collection(db, "reports");
          transaction.set(doc(reportsRef), {
            reporter_data: {
              id: user.uid,
              coins: reporterData.coins * 0.1,
            },
            reported_data: {
              id: userId,
              coins: reportedData.coins * 0.1,
            },
            source: {
              type: "submission / pinned game / interest",
              source: selectedSubmission,
            },
            reason: selectedReason,
            reporter_details: details,
            reported_details: '',
            users: [userId, user.uid],
            status: "pending",
            created_at: Timestamp.now(),
          });
  
          // Deduct coins from reporter
          transaction.update(reporterRef, {
            coins: reporterData.coins * 0.9, // Deduct 10% fee
          });
    
          transaction.update(reportedRef, {
            coins: reportedData.coins * 0.9, // Deduct 10% fee
          });
        });
    
        // Success alert
        Alert.alert(
          "Quick report submitted!",
          "To prevent false reports, we will hold 10% of your coins. Coins will be refunded if your report is valid.",
          [{ text: "Close", style: "default", onPress: () => setShowReportModal(false) }]
        );
    
        // Reset modal fields
        setSelectedReason(null);
    
      } catch (err: any) {
        console.error("Error submitting report:", err);
        Alert.alert("Error", err.message || "Something went wrong. Please try again.");
      }
    };
    

  return (
    <SafeAreaView>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 20 }} />
      ) : submissions.length <= 0 ? (
        <Text>No submissions yet.</Text>
      ) : (
        <FlatList
          data={submissions}
          pagingEnabled
          onViewableItemsChanged={onVerticalItemsChanged}
          viewabilityConfig={viewabilityConfig}
          initialScrollIndex={startIndex || 0}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index: vIndex }) => (
            <View style={{marginBottom: 5,}}>
              <FlatList
              data={item.media}
              horizontal
              pagingEnabled
              onViewableItemsChanged={onHorizontalItemsChanged}
              viewabilityConfig={viewabilityConfig}
              keyExtractor={(m, i) => i.toString()}
              renderItem={({ item: media, index: hIndex }) => (
              //   <TouchableOpacity
              //   activeOpacity={0.9}
              //   onPress={() => toggleMute(item.id, index)}
              // >
                <View>
                {media.type === 'video' ? (
                  <View style={{ width: width, height: width, overflow: 'hidden', }}>
                    <Video
                    source={{ uri: media.uri }}
                    style={{ width: width, height: width + 150,   position: 'absolute', 
                      top: -30, }}
                    shouldPlay={hIndex === horizontalIndex && vIndex === verticalIndex}
                    isLooping
                    isMuted={hIndex !== horizontalIndex && vIndex !== verticalIndex}
                  />
                </View>
                ) : (
                  <Image
                    source={{ uri: media.uri }}
                    style={{ width: width, height: width }}
                  />
                )}
                </View>
                // </TouchableOpacity>
              )}
              />
              <Text>{item.caption}</Text>
              {userId !== user?.uid && <Button title="Report" onPress={() => {setSelectedSubmission(item.id); setShowReportModal(true);}}/>}
            </View>
          )}
          getItemLayout={(data, index) => ({
            length: width, // Height of each item
            offset: width * index, // Offset = height * index
            index,
          })}
          ref={(ref) => {
            flatListRef.current = ref;
          }}
          />
      )}

<Modal
            animationType="slide"
            transparent={true}
            visible={showReportModal}
            onRequestClose={() => setShowReportModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Quick Report</Text>
                <Text style={styles.modalText}>Help us keep the community safe and enjoyable by reporting inappropriate behavior. False reports may result in penalties.</Text>

                <Dropdown
                  style={styles.dropdown}
                  data={reportReasons}
                  labelField="label"
                  valueField="value"
                  placeholder="Select a reason"
                  value={selectedReason}
                  onChange={(item : any) => setSelectedReason(item.value)}
                />

                <TextInput
                  value={details}
                  onChangeText={setDetails}
                  placeholder="Enter details about the report (optional). You can also can add details later in Settings > Reports."
                  maxLength={200}
                  style={{
                    borderWidth: 1,
                    borderColor: '#ccc',
                    padding: 12,
                    marginBottom: 12,
                  }}
                />
                <Text>{details.length}/200</Text>

                <Button title="Cancel" onPress={() => setShowReportModal(false)} />
                <Button title="Submit Report" onPress={reportUser}/>
              </View>
            </View>
          </Modal>
    </SafeAreaView>
  )
};


const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5, // For Android shadow
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  dropdown: {
    height: 50,
    width: '100%', // Set the dropdown to take the full width of its parent
    maxWidth: 300, // Optional: Set a maximum width for the dropdown
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    alignSelf: "center", // Center the dropdown within its parent
  },
  textInput: {
    height: 80,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    textAlignVertical: "top",
  },

});