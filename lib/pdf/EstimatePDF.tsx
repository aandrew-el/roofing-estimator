import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import type { Estimate } from '@/lib/types';

// Helper to format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Helper to format numbers
function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

// PDF Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1a1a2e',
  },
  header: {
    backgroundColor: '#1a1a2e',
    padding: 20,
    marginBottom: 20,
    marginLeft: -40,
    marginRight: -40,
    marginTop: -40,
  },
  headerText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  metaText: {
    fontSize: 9,
    color: '#8898aa',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    color: '#1a1a2e',
  },
  // Estimate Range Box
  rangeBox: {
    backgroundColor: '#1a1a2e',
    padding: 20,
    borderRadius: 4,
    marginBottom: 20,
  },
  rangeTitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 9,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 8,
  },
  rangeMainValue: {
    color: '#4ade80',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  rangeSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  rangeDivider: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    marginVertical: 12,
  },
  rangeSecondary: {
    color: '#ffffff',
    fontSize: 11,
    textAlign: 'center',
  },
  // Project Summary
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  summaryItem: {
    width: '50%',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 9,
    color: '#8898aa',
  },
  summaryValue: {
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
  },
  // Table
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  tableFooter: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderTopWidth: 2,
    borderTopColor: '#1a1a2e',
  },
  colDescription: {
    width: '50%',
  },
  colQty: {
    width: '15%',
    textAlign: 'right',
  },
  colUnit: {
    width: '15%',
    textAlign: 'right',
  },
  colTotal: {
    width: '20%',
    textAlign: 'right',
  },
  tableHeaderText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#64748b',
  },
  itemName: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  itemDescription: {
    fontSize: 8,
    color: '#8898aa',
    marginTop: 2,
  },
  cellText: {
    fontSize: 10,
  },
  subtotalLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'right',
    width: '80%',
  },
  subtotalValue: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'right',
    width: '20%',
  },
  // Disclaimer
  disclaimer: {
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 4,
    marginTop: 20,
  },
  disclaimerText: {
    fontSize: 8,
    color: '#92400e',
    lineHeight: 1.4,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
  },
  footerText: {
    fontSize: 8,
    color: '#8898aa',
  },
});

interface EstimatePDFProps {
  estimate: Estimate;
  customerName?: string;
}

export function EstimatePDF({ estimate, customerName }: EstimatePDFProps) {
  const shingleTypeName =
    estimate.project.shingleType === 'three-tab'
      ? '3-Tab Asphalt'
      : estimate.project.shingleType === 'architectural'
      ? 'Architectural'
      : 'Premium Designer';

  const formattedDate = new Date(estimate.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>Roofing Estimate</Text>
        </View>

        {/* Meta info */}
        <View style={styles.metaRow}>
          <View>
            {customerName && (
              <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 4 }}>
                Prepared for: {customerName}
              </Text>
            )}
            <Text style={styles.metaText}>Generated: {formattedDate}</Text>
          </View>
          <View style={{ textAlign: 'right' }}>
            <Text style={styles.metaText}>Estimate ID</Text>
            <Text style={{ fontSize: 10, fontFamily: 'Courier' }}>{estimate.id}</Text>
          </View>
        </View>

        {/* Estimate Range */}
        <View style={styles.rangeBox}>
          <Text style={styles.rangeTitle}>ESTIMATE RANGE</Text>
          <Text style={styles.rangeMainValue}>{formatCurrency(estimate.midEstimate)}</Text>
          <Text style={styles.rangeSubtext}>Expected Cost</Text>
          <View style={styles.rangeDivider} />
          <Text style={styles.rangeSecondary}>
            Low: {formatCurrency(estimate.lowEstimate)}  ·  High: {formatCurrency(estimate.highEstimate)}
          </Text>
        </View>

        {/* Project Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Project Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Location</Text>
              <Text style={styles.summaryValue}>{estimate.project.location}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Roof Area</Text>
              <Text style={styles.summaryValue}>{formatNumber(estimate.roofArea)} sq ft</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Pitch</Text>
              <Text style={styles.summaryValue}>{estimate.project.pitch}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Material</Text>
              <Text style={styles.summaryValue}>{shingleTypeName}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Stories</Text>
              <Text style={styles.summaryValue}>{estimate.project.stories}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Roofing Squares</Text>
              <Text style={styles.summaryValue}>{estimate.squares}</Text>
            </View>
          </View>
        </View>

        {/* Itemized Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Itemized Breakdown</Text>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <View style={styles.colDescription}>
                <Text style={styles.tableHeaderText}>Description</Text>
              </View>
              <View style={styles.colQty}>
                <Text style={styles.tableHeaderText}>Qty</Text>
              </View>
              <View style={styles.colUnit}>
                <Text style={styles.tableHeaderText}>Unit</Text>
              </View>
              <View style={styles.colTotal}>
                <Text style={styles.tableHeaderText}>Total</Text>
              </View>
            </View>

            {/* Table Rows */}
            {estimate.lineItems.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <View style={styles.colDescription}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  {item.description && (
                    <Text style={styles.itemDescription}>{item.description}</Text>
                  )}
                </View>
                <View style={styles.colQty}>
                  <Text style={styles.cellText}>{item.quantity}</Text>
                </View>
                <View style={styles.colUnit}>
                  <Text style={styles.cellText}>{item.unit}</Text>
                </View>
                <View style={styles.colTotal}>
                  <Text style={styles.cellText}>{formatCurrency(item.total)}</Text>
                </View>
              </View>
            ))}

            {/* Table Footer */}
            <View style={styles.tableFooter}>
              <Text style={styles.subtotalLabel}>Subtotal</Text>
              <Text style={styles.subtotalValue}>{formatCurrency(estimate.subtotal)}</Text>
            </View>
          </View>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            This estimate is provided for planning purposes only. Actual costs may vary based on
            site inspection, material availability, and local market conditions. Please obtain
            multiple quotes from licensed contractors before proceeding with any work.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Generated by Roofing Estimator</Text>
        </View>
      </Page>
    </Document>
  );
}

export default EstimatePDF;
