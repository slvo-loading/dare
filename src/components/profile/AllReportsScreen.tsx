import { View, Text, Button, SafeAreaView, ScrollView, TouchableOpacity, Image, Modal,
  StyleSheet, TextInput
  } from "react-native";
import { ProfileStackProps } from "../../types";
import { useAuth } from "../../context/AuthContext";
import React, { useState, useEffect } from "react";
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    doc, 
    getDoc, 
    deleteDoc, 
    setDoc, 
    serverTimestamp,
    updateDoc,
    documentId,
    orderBy
 } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';

type Report = {
    id: string;
    reason: string;
    status: string;
    reporterDetails: string;
    reportedDetails: string;
    createdAt: string;
    source: {type: string, source: string};
    reporter: { id: string, coins: string };
    reported: { id: string, coins: string };
}


export default function AllReportsScreen({ navigation }: ProfileStackProps<'AllReportsScreen'>) {
  const { user } = useAuth();
  const [inReports, setInReports] = useState<Report[]>([]);
  const [outReports, setOutReports] = useState<Report[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [showDetailsForm, setShowDetailsForm] = useState(false);
  const [details, setDetails] = useState<string>("");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    fetchReports();
  })

  const fetchReports = async () => {
    if (!user) return;

    try {
        // Fetch reports from the database
        const reportsQuery = query(collection(db, "reports"), where("users", "array-contains", user.uid), orderBy("created_at", "desc"));
        const reportsSnapshot = await getDocs(reportsQuery);

        const reportsList: Report[] = [];
        const reportsInList: Report[] = [];
        const reportsOutList: Report[] = [];

        reportsSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.status === 'pending') {
                const reporter = data.reporter === user.uid;
                if (reporter) {
                    reportsOutList.push({
                      id: doc.id,
                      reason: data.reason,
                      status: data.status,
                      source: data.source,
                      reporterDetails: data.reporter_details,
                      reportedDetails: data.reported_details,
                      createdAt: data.created_at.toDate().toISOString(),
                      reporter: data.reporter_data,
                      reported: data.reported_data
                    })
                } else {
                    reportsInList.push({
                        id: doc.id,
                        reason: data.reason,
                        status: data.status,
                        source: data.source,
                        reporterDetails: data.reporter_details,
                        reportedDetails: data.reported_details,
                        createdAt: data.created_at.toDate().toISOString(),
                        reporter: data.reporter_data,
                        reported: data.reported_data
                    });
                }
            } else {
                reportsList.push({
                    id: doc.id,
                    reason: data.reason,
                    status: data.status,
                    source: data.source,
                    reporterDetails: data.reporter_details,
                    reportedDetails: data.reported_details,
                    createdAt: data.created_at.toDate().toISOString(),
                    reporter: data.reporter_data,
                    reported: data.reported_data
                });
            }
        });

        setReports(reportsList);
        setInReports(reportsInList);
        setOutReports(reportsOutList);

    } catch (error) {
      console.error("Error fetching reports: ", error);
    }
  }

  const handleDetail = async () => {
    if (!user || !selectedReport) return;
    try {
      const reportRef = doc(db, "reports", selectedReport.id);
      const reportSnap = await getDoc(reportRef);

      if (reportSnap.exists()) {
        const reportData = reportSnap.data();
        if (reportData.reporter_data.id === user.uid) {
          await updateDoc(reportRef, {
            reporter_details: details
          });
        } else if (reportData.reported_data.id === user.uid ) {
          await updateDoc(reportRef, {
            reported_details: details
          });
        }
      } else {
        console.log("No such report!");
      }
    } catch (error) {
      console.error("Error adding details to report: ", error);
    }

    setShowDetailsForm(false);
    setDetails("");
  }

  return (
    <SafeAreaView>
      <Button title="Back" onPress={() => navigation.goBack()}/>
      <Text>Incoming Reports</Text>
      <ScrollView>
        {inReports
          .map((report: Report) => (
              <TouchableOpacity key={report.id} style={{ flexDirection: 'column', marginBottom: 12 }} onPress={() => {setShowReport(true); setSelectedReport(report);}}>
                <Text style={{ color: '#666', marginRight: 10 }}># {report.id}</Text>
                <Text></Text>
                <Text style={{ color: '#666', marginRight: 10 }}>Reason: {report.reason}</Text>
                <Text style={{ color: '#666', marginRight: 10 }}>Status: {report.status}</Text>
                <Text style={{ color: '#666', marginRight: 10 }}>Source: {report.source.type}</Text>
                <Text style={{ color: '#666', marginRight: 10 }}>{report.createdAt}</Text>
              </TouchableOpacity>
        ))}
      </ScrollView>

      <Text>Outgoing Reports</Text>
      <ScrollView>
        {outReports
          .map((report: Report) => (
              <TouchableOpacity key={report.id} style={{ flexDirection: 'column', marginBottom: 12 }} onPress={() => {setSelectedReport(report); setShowReport(true);}}>
                <Text style={{ color: '#666', marginRight: 10 }}># {report.id}</Text>
                <Text></Text>
                <Text style={{ color: '#666', marginRight: 10 }}>Reason: {report.reason}</Text>
                <Text style={{ color: '#666', marginRight: 10 }}>Status: {report.status}</Text>
                <Text style={{ color: '#666', marginRight: 10 }}>Source: {report.source.type}</Text>
                <Text style={{ color: '#666', marginRight: 10 }}>{report.createdAt}</Text>
              </TouchableOpacity>
        ))}
      </ScrollView>

      <Text>Past Reports</Text>
      <ScrollView>
        {reports
          .map((report: Report) => (
              <TouchableOpacity key={report.id} style={{ flexDirection: 'column', marginBottom: 12 }} onPress={() => {setSelectedReport(report); setShowReport(true);}}>
                <Text style={{ color: '#666', marginRight: 10 }}># {report.id}</Text>
                <Text></Text>
                <Text style={{ color: '#666', marginRight: 10 }}>Reason: {report.reason}</Text>
                <Text style={{ color: '#666', marginRight: 10 }}>Status: {report.status}</Text>
                <Text style={{ color: '#666', marginRight: 10 }}>Source: {report.source.type}</Text>
                <Text style={{ color: '#666', marginRight: 10 }}>{report.createdAt}</Text>
              </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={showReport}
        onRequestClose={() => setShowReport(false)}
      >
        <View style={styles.modalOverlay}>
        <Button title="X" onPress={() => setShowReport(false)} />
          <View style={styles.modalContainer}>
            <Text style={{ color: '#666', marginRight: 10 }}># {selectedReport?.id}</Text>
            <Text></Text>
            <Text style={{ color: '#666', marginRight: 10 }}>Reason: {selectedReport?.reason}</Text>
            <Text style={{ color: '#666', marginRight: 10 }}>Status: {selectedReport?.status}</Text>
            <Text style={{ color: '#666', marginRight: 10 }}>Source: {selectedReport?.source.type}</Text>
            <Text style={{ color: '#666', marginRight: 10 }}>{selectedReport?.createdAt}</Text>
            <Text></Text>
            {selectedReport && selectedReport?.reporterDetails.length > 0 ? 
              (<Text style={{ color: '#666', marginRight: 10 }}>
                Reporter's Details: {selectedReport?.reporterDetails}</Text> 
              ) : (
                <Text>No detials from user</Text>
            )}
            <Text></Text>
            {selectedReport && selectedReport?.reportedDetails.length > 0 ? 
              (<Text style={{ color: '#666', marginRight: 10 }}>
                Reported User's Details: {selectedReport?.reportedDetails}</Text> 
              ) : (
                <Text>No detials from user</Text>
            )}

            {selectedReport && selectedReport.status === 'pending' && ((selectedReport.reporterDetails.length > 0 && selectedReport.reporter.id === user?.uid) || 
                (selectedReport.reportedDetails.length > 0 && selectedReport.reported.id === user?.uid)) &&
              <Button
                title="Add Details"
                onPress={() => setShowDetailsForm(true)}
              />
            }

            {showDetailsForm && 
              <View>
                <TextInput
                  value={details}
                  onChangeText={setDetails}
                  placeholder="Enter details about the report (optional). You can only enter details once. If you choose not to enter them now, you can add them later in Settings > Reports."
                  maxLength={200}
                  style={{
                    borderWidth: 1,
                    borderColor: '#ccc',
                    padding: 12,
                    marginBottom: 12,
                  }}
                />
                <Text>{details.length}/200</Text>
                <Button title="Cancel" onPress={() => setShowDetailsForm(false)}/>
                <Button
                  title="Submit Details"
                  onPress={handleDetail}
                />
              </View>
              }
          </View>
        </View>
      </Modal>

      
    </SafeAreaView>
  );
}


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