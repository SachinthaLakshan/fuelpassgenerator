import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { PDFViewer } from '@react-pdf/renderer';
import { PDFDownloadLink } from '@react-pdf/renderer';

const PDF = (props) => {
  const styles = StyleSheet.create({
    page: {
      flexDirection: 'row',
      backgroundColor: '#FFF'
    },
    section: {
      backgroundColor: '#FDD610',
      border: '10px solid #FD6310',
      width: '225px',
      height: '340px',
      margin: 10,

    },
    headerLogo: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '10px',
      marginBottom: '10px',
      marginLeft: '15px',
      marginRight: '15px'
    },
    headerIamge: {
      height: '60px'
    },
    headerText: {
      backgroundColor: '#FD6310',
      height: '40px',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: '800',
    },
    headerText1: {
      fontWeight: '800',
    },
    QRimage: {
      width: '205px',
      height: '205px'
    }
  });

  const MyDocument = () => (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <View style={styles.headerLogo}>
            <Image style={styles.headerIamge} src="ceypetco_logo.png"></Image>
            <Image style={styles.headerIamge} src="Lanka_IOC_logo.png"></Image>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerText1}>NATIONAL FUEL PASS</Text>
          </View>
          <View style={styles.QRsection}>
            <Image style={styles.QRimage} src={props.image}></Image>
          </View>
        </View>
      </Page>
    </Document>
  );
  return (
    <div className='d-flex flex-column align-items-center mt-4'>
      <PDFViewer height={500} width={300}>
        <MyDocument />
      </PDFViewer>
      <PDFDownloadLink document={<MyDocument />} fileName={"pass"}>
        <button class="btn btn-danger mt-4 mb-2"> Download PDF </button>
      </PDFDownloadLink>
      <button type="button" className="btn btn-secondary" onClick={props.onGoBack}>Go back</button>
    </div>
  );
}

export default PDF;