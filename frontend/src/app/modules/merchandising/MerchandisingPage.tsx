import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Link,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CloseIcon from '@mui/icons-material/Close';
import { apiClient } from '../../shared/services/api';

type OrderInfo = {
  buyer: string;
  season: string;
  styleNo: string;
  poNumber: string;
  currency: string;
  factory: string;
};

type OrderColorEntry = {
  id: string;
  color: string;
  unitPrice: number;
  sizeQuantities: Record<string, number>;
};

type OrderDeliveryGroup = {
  id: string;
  deliveryDate: string;
  countryCodes: string;
  sizes: string[];
  colorEntries: OrderColorEntry[];
};

type OrderSummary = {
  id: number;
  status: 'draft' | 'review';
  targetTotal: number;
  actualTotal: number;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
};

type OrderDetail = OrderSummary & {
  orderInfo: Record<string, unknown>;
  masterTarget: Record<string, number>;
  deliveries: Array<{
    deliveryDate: string;
    countryCodes: string;
    sizes: string[];
    colorEntries: Array<{
      color: string;
      unitPrice: number;
      sizeQuantities: Record<string, number>;
    }>;
  }>;
};

const SIZE_CATALOG = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const createSizeQuantities = () =>
  SIZE_CATALOG.reduce<Record<string, number>>((acc, size) => {
    acc[size] = 0;
    return acc;
  }, {});

const createColorEntry = (): OrderColorEntry => ({
  id: `${Date.now()}-${Math.random()}`,
  color: '',
  unitPrice: 0,
  sizeQuantities: createSizeQuantities(),
});

const createDeliveryGroup = (): OrderDeliveryGroup => ({
  id: `${Date.now()}-${Math.random()}`,
  deliveryDate: '',
  countryCodes: '',
  sizes: ['S', 'M', 'L'],
  colorEntries: [createColorEntry()],
});

export function MerchandisingPage() {
  const [openCreateOrder, setOpenCreateOrder] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'review'>('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [fromDateFilter, setFromDateFilter] = useState('');
  const [toDateFilter, setToDateFilter] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false);
  const [orderDetailsLoading, setOrderDetailsLoading] = useState(false);
  const [orderDetailsError, setOrderDetailsError] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderDetail | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [customSizeInputs, setCustomSizeInputs] = useState<Record<string, string>>({});
  const [orderInfo, setOrderInfo] = useState<OrderInfo>({
    buyer: '',
    season: '',
    styleNo: '',
    poNumber: '',
    currency: 'USD',
    factory: '',
  });
  const [deliveries, setDeliveries] = useState<OrderDeliveryGroup[]>([createDeliveryGroup()]);

  const allSizes = useMemo(() => {
    const deliverySizes = deliveries.flatMap((delivery) => delivery.sizes);
    const quantitySizes = deliveries.flatMap((delivery) =>
      delivery.colorEntries.flatMap((entry) => Object.keys(entry.sizeQuantities || {})),
    );

    const extras = [...new Set([...deliverySizes, ...quantitySizes])].filter(
      (size) => !SIZE_CATALOG.includes(size),
    );

    return [...SIZE_CATALOG.filter((size) => [...deliverySizes, ...quantitySizes].includes(size)), ...extras];
  }, [deliveries]);

  const actualBySize = useMemo(() => {
    const totals = allSizes.reduce<Record<string, number>>((acc, size) => {
      acc[size] = 0;
      return acc;
    }, {});
    deliveries.forEach((delivery) => {
      delivery.colorEntries.forEach((entry) => {
        allSizes.forEach((size) => {
          totals[size] += Number(entry.sizeQuantities[size] || 0);
        });
      });
    });
    return totals;
  }, [allSizes, deliveries]);

  const colorWiseSummary = useMemo(() => {
    const rows = new Map<
      string,
      { color: string; bySize: Record<string, number>; totalQty: number; totalAmount: number }
    >();

    deliveries.forEach((delivery) => {
      delivery.colorEntries.forEach((entry) => {
        const color = entry.color.trim() || 'UNSPECIFIED';
        const existing = rows.get(color) ?? {
          color,
          bySize: allSizes.reduce<Record<string, number>>((acc, size) => {
            acc[size] = 0;
            return acc;
          }, {}),
          totalQty: 0,
          totalAmount: 0,
        };

        let rowQty = 0;
        allSizes.forEach((size) => {
          const value = Number(entry.sizeQuantities[size] || 0);
          existing.bySize[size] += value;
          rowQty += value;
        });

        existing.totalQty += rowQty;
        existing.totalAmount += rowQty * Number(entry.unitPrice || 0);
        rows.set(color, existing);
      });
    });

    return [...rows.values()].sort((a, b) => a.color.localeCompare(b.color));
  }, [allSizes, deliveries]);

  const actualTotal = useMemo(
    () => allSizes.reduce((sum, size) => sum + Number(actualBySize[size] || 0), 0),
    [actualBySize, allSizes],
  );

  const totalAmount = useMemo(() => {
    return deliveries.reduce((deliverySum, delivery) => {
      const groupAmount = delivery.colorEntries.reduce((colorSum, entry) => {
        const qty = Object.values(entry.sizeQuantities).reduce((q, sizeQty) => q + Number(sizeQty || 0), 0);
        return colorSum + qty * Number(entry.unitPrice || 0);
      }, 0);
      return deliverySum + groupAmount;
    }, 0);
  }, [deliveries]);

  const hasMismatch = false;

  const filteredOrders = useMemo(() => {
    const search = searchFilter.trim().toLowerCase();
    const fromTs = fromDateFilter ? new Date(fromDateFilter).getTime() : null;
    const toTs = toDateFilter ? new Date(`${toDateFilter}T23:59:59`).getTime() : null;

    return orders.filter((order) => {
      if (statusFilter !== 'all' && order.status !== statusFilter) {
        return false;
      }

      if (search) {
        const haystack = `${order.id} ${order.status} ${order.targetTotal} ${order.actualTotal} ${order.totalAmount}`.toLowerCase();
        if (!haystack.includes(search)) {
          return false;
        }
      }

      const createdTs = new Date(order.createdAt).getTime();
      if (fromTs !== null && createdTs < fromTs) {
        return false;
      }
      if (toTs !== null && createdTs > toTs) {
        return false;
      }

      return true;
    });
  }, [orders, statusFilter, searchFilter, fromDateFilter, toDateFilter]);

  const fetchOrders = async () => {
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      const response = await apiClient.get<OrderSummary[]>('/orders');
      setOrders(response.data);
    } catch (err: unknown) {
      const message =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { message?: string | string[] } } }).response?.data?.message
          : undefined;
      const normalizedMessage = Array.isArray(message) ? message.join(', ') : message;
      setOrdersError(normalizedMessage || 'Failed to load orders.');
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    void fetchOrders();
  }, []);

  const fetchOrderDetails = async (orderId: number) => {
    setOrderDetailsLoading(true);
    setOrderDetailsError(null);
    setOrderDetails(null);
    try {
      const response = await apiClient.get<OrderDetail>(`/orders/${orderId}`);
      setOrderDetails(response.data);
    } catch (err: unknown) {
      const message =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { message?: string | string[] } } }).response?.data?.message
          : undefined;
      const normalizedMessage = Array.isArray(message) ? message.join(', ') : message;
      setOrderDetailsError(normalizedMessage || 'Failed to load order details.');
    } finally {
      setOrderDetailsLoading(false);
    }
  };

  const openOrderDetails = (orderId: number) => {
    setSelectedOrderId(orderId);
    setOrderDetailsOpen(true);
    void fetchOrderDetails(orderId);
  };

  const updateDelivery = (deliveryId: string, updater: (delivery: OrderDeliveryGroup) => OrderDeliveryGroup) => {
    setDeliveries((prev) => prev.map((delivery) => (delivery.id === deliveryId ? updater(delivery) : delivery)));
  };

  const updateDeliveryField = (deliveryId: string, field: 'deliveryDate' | 'countryCodes', value: string) => {
    updateDelivery(deliveryId, (delivery) => ({ ...delivery, [field]: value }));
  };

  const toggleDeliverySize = (deliveryId: string, size: string) => {
    updateDelivery(deliveryId, (delivery) => {
      const exists = delivery.sizes.includes(size);
      const nextSizes = exists ? delivery.sizes.filter((s) => s !== size) : [...delivery.sizes, size];

      const nextColorEntries = delivery.colorEntries.map((entry) => {
        if (exists) {
          const nextQuantities = { ...entry.sizeQuantities };
          delete nextQuantities[size];
          return {
            ...entry,
            sizeQuantities: nextQuantities,
          };
        }

        return {
          ...entry,
          sizeQuantities: {
            ...entry.sizeQuantities,
            [size]: entry.sizeQuantities[size] ?? 0,
          },
        };
      });

      return { ...delivery, sizes: nextSizes, colorEntries: nextColorEntries };
    });

  };

  const addCustomSize = (deliveryId: string) => {
    const rawValue = customSizeInputs[deliveryId] ?? '';
    const normalized = rawValue.trim().toUpperCase();

    if (!normalized) {
      return;
    }

    const targetDelivery = deliveries.find((delivery) => delivery.id === deliveryId);
    if (targetDelivery?.sizes.includes(normalized)) {
      setCustomSizeInputs((prev) => ({ ...prev, [deliveryId]: '' }));
      return;
    }

    toggleDeliverySize(deliveryId, normalized);
    setCustomSizeInputs((prev) => ({ ...prev, [deliveryId]: '' }));
  };

  const updateColorField = (
    deliveryId: string,
    colorId: string,
    field: 'color' | 'unitPrice',
    value: string,
  ) => {
    updateDelivery(deliveryId, (delivery) => ({
      ...delivery,
      colorEntries: delivery.colorEntries.map((entry) => {
        if (entry.id !== colorId) {
          return entry;
        }
        if (field === 'unitPrice') {
          return { ...entry, unitPrice: Number(value || 0) };
        }
        return { ...entry, color: value };
      }),
    }));
  };

  const updateColorQty = (deliveryId: string, colorId: string, size: string, value: string) => {
    updateDelivery(deliveryId, (delivery) => ({
      ...delivery,
      colorEntries: delivery.colorEntries.map((entry) => {
        if (entry.id !== colorId) {
          return entry;
        }
        return {
          ...entry,
          sizeQuantities: {
            ...entry.sizeQuantities,
            [size]: Number(value || 0),
          },
        };
      }),
    }));
  };

  const addColor = (deliveryId: string) => {
    updateDelivery(deliveryId, (delivery) => ({
      ...delivery,
      colorEntries: [...delivery.colorEntries, createColorEntry()],
    }));
  };

  const addDelivery = () => {
    setDeliveries((prev) => [...prev, createDeliveryGroup()]);
  };

  const removeDelivery = (deliveryId: string) => {
    setDeliveries((prev) => (prev.length === 1 ? prev : prev.filter((delivery) => delivery.id !== deliveryId)));
  };

  const resetForm = () => {
    setOrderInfo({
      buyer: '',
      season: '',
      styleNo: '',
      poNumber: '',
      currency: 'USD',
      factory: '',
    });
    setDeliveries([createDeliveryGroup()]);
    setCustomSizeInputs({});
    setSubmitError(null);
  };

  const submitOrder = async (status: 'draft' | 'review') => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      await apiClient.post('/orders', {
        status,
        orderInfo,
        masterTarget: actualBySize,
        deliveries,
      });
      setSubmitSuccess(status === 'draft' ? 'Order draft saved successfully.' : 'Order submitted for review.');
      setOpenCreateOrder(false);
      resetForm();
      void fetchOrders();
    } catch (err: unknown) {
      const message =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { message?: string | string[] } } }).response?.data?.message
          : undefined;

      const normalizedMessage = Array.isArray(message) ? message.join(', ') : message;
      setSubmitError(normalizedMessage || 'Failed to save order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const saveDraft = async () => {
    await submitOrder('draft');
  };

  const reviewOrder = async () => {
    if (hasMismatch) {
      return;
    }
    await submitOrder('review');
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        Merchandising Operations
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Manage your orders and procurement processes from a central hub.
      </Typography>

      {submitSuccess && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSubmitSuccess(null)}>
          {submitSuccess}
        </Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        {/* Create Order Card */}
        <Card
          sx={{
            borderRadius: 2,
            boxShadow: 1,
            border: '1px solid',
            borderColor: 'divider',
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: 3,
              transform: 'translateY(-4px)',
            },
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 1,
                  bgcolor: 'primary.light',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <TaskAltIcon sx={{ fontSize: 32, color: 'primary.main' }} />
              </Box>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              Create Order
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Enter new buyer orders, define style details, set quantity breakdowns, and generate initial order numbers.
            </Typography>
            <Button
              variant="text"
              sx={{ px: 0, textTransform: 'none', fontWeight: 700 }}
              onClick={() => {
                setSubmitError(null);
                setOpenCreateOrder(true);
              }}
            >
              Go to Form {'->'}
            </Button>
          </CardContent>
        </Card>

        {/* Sub-Purchase Order Card */}
        <Card
          sx={{
            borderRadius: 2,
            boxShadow: 1,
            border: '1px solid',
            borderColor: 'divider',
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: 3,
              transform: 'translateY(-4px)',
            },
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 1,
                  bgcolor: 'success.light',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShoppingCartIcon sx={{ fontSize: 32, color: 'success.main' }} />
              </Box>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              Sub-Purchase Order
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Create purchase orders for suppliers linked to main orders. Manage raw material procurement and ETAs.
            </Typography>
            <Link
              href="#"
              sx={{
                color: 'success.main',
                textDecoration: 'none',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              Go to Form →
            </Link>
          </CardContent>
        </Card>
      </Box>

      <Paper variant="outlined" sx={{ mt: 3, p: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Recent Orders
          </Typography>
          <Button size="small" onClick={() => void fetchOrders()} disabled={ordersLoading}>
            {ordersLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '180px minmax(180px, 1fr) 170px 170px' },
            gap: 1,
            mb: 1.5,
          }}
        >
          <TextField
            select
            size="small"
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'draft' | 'review')}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="draft">Draft</MenuItem>
            <MenuItem value="review">Review</MenuItem>
          </TextField>
          <TextField
            size="small"
            label="Search"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search by id, status, totals"
          />
          <TextField
            size="small"
            type="date"
            label="From"
            InputLabelProps={{ shrink: true }}
            value={fromDateFilter}
            onChange={(e) => setFromDateFilter(e.target.value)}
            sx={(theme) => ({ '& input': { colorScheme: theme.palette.mode } })}
          />
          <TextField
            size="small"
            type="date"
            label="To"
            InputLabelProps={{ shrink: true }}
            value={toDateFilter}
            onChange={(e) => setToDateFilter(e.target.value)}
            sx={(theme) => ({ '& input': { colorScheme: theme.palette.mode } })}
          />
        </Box>

        {ordersError && (
          <Alert severity="error" sx={{ mb: 1.5 }}>
            {ordersError}
          </Alert>
        )}

        {ordersLoading ? (
          <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={26} />
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Order ID</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Target Qty</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Actual Qty</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Created</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ color: 'text.secondary' }}>
                      No orders found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>#{order.id}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={order.status === 'review' ? 'Review' : 'Draft'}
                          color={order.status === 'review' ? 'success' : 'default'}
                          variant={order.status === 'review' ? 'filled' : 'outlined'}
                        />
                      </TableCell>
                      <TableCell align="right">{order.targetTotal}</TableCell>
                      <TableCell align="right">{order.actualTotal}</TableCell>
                      <TableCell align="right">{Number(order.totalAmount).toFixed(2)}</TableCell>
                      <TableCell>{new Date(order.createdAt).toLocaleString()}</TableCell>
                      <TableCell align="right">
                        <Button size="small" onClick={() => openOrderDetails(order.id)}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={orderDetailsOpen} onClose={() => setOrderDetailsOpen(false)} fullWidth maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 1 }}>
          <DialogTitle sx={{ fontWeight: 700 }}>
            Order Details {selectedOrderId ? `#${selectedOrderId}` : ''}
          </DialogTitle>
          <IconButton onClick={() => setOrderDetailsOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <DialogContent dividers>
          {orderDetailsLoading && (
            <Box sx={{ py: 5, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress size={28} />
            </Box>
          )}

          {!orderDetailsLoading && orderDetailsError && (
            <Alert severity="error">{orderDetailsError}</Alert>
          )}

          {!orderDetailsLoading && !orderDetailsError && orderDetails && (
            <Stack spacing={2}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Summary</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 1 }}>
                  <Typography variant="body2">Status: {orderDetails.status}</Typography>
                  <Typography variant="body2">Target Qty: {orderDetails.targetTotal}</Typography>
                  <Typography variant="body2">Actual Qty: {orderDetails.actualTotal}</Typography>
                  <Typography variant="body2">Amount: {Number(orderDetails.totalAmount).toFixed(2)}</Typography>
                  <Typography variant="body2">Created: {new Date(orderDetails.createdAt).toLocaleString()}</Typography>
                  <Typography variant="body2">Updated: {new Date(orderDetails.updatedAt).toLocaleString()}</Typography>
                </Box>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>Order Info</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 1 }}>
                  {Object.entries(orderDetails.orderInfo).map(([key, value]) => (
                    <Typography key={key} variant="body2">
                      <Box component="span" sx={{ color: 'text.secondary' }}>
                        {key}:
                      </Box>{' '}
                      {String(value ?? '')}
                    </Typography>
                  ))}
                </Box>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2, overflowX: 'auto' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>Master Target</Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Size</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Target Qty</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(orderDetails.masterTarget).map(([size, qty]) => (
                      <TableRow key={size}>
                        <TableCell>{size}</TableCell>
                        <TableCell align="right">{qty}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>

              <Stack spacing={1.5}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Deliveries</Typography>
                {orderDetails.deliveries.length === 0 ? (
                  <Alert severity="info">No delivery splits available.</Alert>
                ) : (
                  orderDetails.deliveries.map((delivery, index) => (
                    <Paper key={`${delivery.deliveryDate}-${index}`} variant="outlined" sx={{ p: 2 }}>
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
                          gap: 1,
                          mb: 1.5,
                        }}
                      >
                        <Typography variant="body2">
                          <Box component="span" sx={{ color: 'text.secondary' }}>Delivery Date:</Box>{' '}
                          {delivery.deliveryDate || '-'}
                        </Typography>
                        <Typography variant="body2">
                          <Box component="span" sx={{ color: 'text.secondary' }}>Countries:</Box>{' '}
                          {delivery.countryCodes || '-'}
                        </Typography>
                        <Typography variant="body2">
                          <Box component="span" sx={{ color: 'text.secondary' }}>Sizes:</Box>{' '}
                          {delivery.sizes.join(', ') || '-'}
                        </Typography>
                      </Box>

                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 700 }}>Color</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700 }}>Unit Price</TableCell>
                              {delivery.sizes.map((size) => (
                                <TableCell key={size} align="right" sx={{ fontWeight: 700 }}>
                                  {size}
                                </TableCell>
                              ))}
                              <TableCell align="right" sx={{ fontWeight: 700 }}>Total Qty</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700 }}>Amount</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {delivery.colorEntries.map((entry, rowIndex) => {
                              const rowQty = delivery.sizes.reduce(
                                (sum, size) => sum + Number(entry.sizeQuantities[size] || 0),
                                0,
                              );
                              const rowAmount = rowQty * Number(entry.unitPrice || 0);

                              return (
                                <TableRow key={`${entry.color}-${rowIndex}`}>
                                  <TableCell>{entry.color || '-'}</TableCell>
                                  <TableCell align="right">{Number(entry.unitPrice).toFixed(2)}</TableCell>
                                  {delivery.sizes.map((size) => (
                                    <TableCell key={size} align="right">{Number(entry.sizeQuantities[size] || 0)}</TableCell>
                                  ))}
                                  <TableCell align="right">{rowQty}</TableCell>
                                  <TableCell align="right">{rowAmount.toFixed(2)}</TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Paper>
                  ))
                )}
              </Stack>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOrderDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        fullWidth
        maxWidth="xl"
        open={openCreateOrder}
        onClose={() => setOpenCreateOrder(false)}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 1 }}>
          <DialogTitle sx={{ fontWeight: 700 }}>Create Purchase Order</DialogTitle>
          <IconButton onClick={() => setOpenCreateOrder(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <DialogContent dividers sx={{ pb: 0 }}>
          {submitError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {submitError}
            </Alert>
          )}

          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
              Header Information
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 1.5 }}>
              <TextField
                size="small"
                label="Buyer"
                value={orderInfo.buyer}
                onChange={(e) => setOrderInfo((prev) => ({ ...prev, buyer: e.target.value }))}
              />
              <TextField
                size="small"
                label="Season"
                value={orderInfo.season}
                onChange={(e) => setOrderInfo((prev) => ({ ...prev, season: e.target.value }))}
              />
              <TextField
                size="small"
                label="Style No"
                value={orderInfo.styleNo}
                onChange={(e) => setOrderInfo((prev) => ({ ...prev, styleNo: e.target.value }))}
              />
              <TextField
                size="small"
                label="PO Number"
                value={orderInfo.poNumber}
                onChange={(e) => setOrderInfo((prev) => ({ ...prev, poNumber: e.target.value }))}
              />
              <TextField
                size="small"
                label="Currency"
                value={orderInfo.currency}
                onChange={(e) => setOrderInfo((prev) => ({ ...prev, currency: e.target.value }))}
              />
              <TextField
                size="small"
                label="Factory"
                value={orderInfo.factory}
                onChange={(e) => setOrderInfo((prev) => ({ ...prev, factory: e.target.value }))}
              />
            </Box>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, mb: 2, overflowX: 'auto' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
              Master Summary (Auto from Delivery Splits)
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Type / Color</TableCell>
                  {allSizes.map((size) => (
                    <TableCell key={size} align="right" sx={{ fontWeight: 700 }}>
                      {size}
                    </TableCell>
                  ))}
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Total Qty</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Summary</TableCell>
                  {allSizes.map((size) => (
                    <TableCell key={size} align="right">{actualBySize[size]}</TableCell>
                  ))}
                  <TableCell align="right" sx={{ fontWeight: 700 }}>{actualTotal}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>{totalAmount.toFixed(2)}</TableCell>
                </TableRow>
                {colorWiseSummary.map((row) => (
                  <TableRow key={row.color}>
                    <TableCell sx={{ color: 'text.secondary' }}>{row.color}</TableCell>
                    {allSizes.map((size) => (
                      <TableCell key={`${row.color}-${size}`} align="right">{row.bySize[size] || 0}</TableCell>
                    ))}
                    <TableCell align="right">{row.totalQty}</TableCell>
                    <TableCell align="right">{row.totalAmount.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>

          <Stack spacing={2} sx={{ pb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Delivery Splits
            </Typography>
            {deliveries.map((delivery, index) => {
              const groupTotalQty = delivery.colorEntries.reduce((sum, entry) => {
                return sum + delivery.sizes.reduce((s, size) => s + Number(entry.sizeQuantities[size] || 0), 0);
              }, 0);
              const groupTotalAmount = delivery.colorEntries.reduce((sum, entry) => {
                const qty = delivery.sizes.reduce((s, size) => s + Number(entry.sizeQuantities[size] || 0), 0);
                return sum + qty * Number(entry.unitPrice || 0);
              }, 0);

              return (
                <Paper key={delivery.id} variant="outlined" sx={{ p: 2 }}>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 1.5 }}>
                    <TextField
                      type="date"
                      size="small"
                      label="Delivery Date"
                      InputLabelProps={{ shrink: true }}
                      value={delivery.deliveryDate}
                      onChange={(e) => updateDeliveryField(delivery.id, 'deliveryDate', e.target.value)}
                      sx={(theme) => ({ minWidth: 210, '& input': { colorScheme: theme.palette.mode } })}
                    />
                    <TextField
                      size="small"
                      label="Country Codes (comma separated)"
                      value={delivery.countryCodes}
                      onChange={(e) => updateDeliveryField(delivery.id, 'countryCodes', e.target.value)}
                      fullWidth
                    />
                    <Button color="error" onClick={() => removeDelivery(delivery.id)} disabled={deliveries.length === 1}>
                      Remove
                    </Button>
                  </Stack>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mr: 1, alignSelf: 'center' }}>
                      Selected Sizes:
                    </Typography>
                    {delivery.sizes.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        No sizes selected
                      </Typography>
                    ) : (
                      delivery.sizes.map((size) => <Chip key={`selected-${size}`} label={size} size="small" variant="outlined" />)
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mr: 1, alignSelf: 'center' }}>
                      Quick Add:
                    </Typography>
                    {SIZE_CATALOG.map((size) => {
                      const selected = delivery.sizes.includes(size);
                      return (
                        <Chip
                          key={size}
                          label={size}
                          clickable
                          color={selected ? 'primary' : 'default'}
                          variant={selected ? 'filled' : 'outlined'}
                          onClick={() => toggleDeliverySize(delivery.id, size)}
                        />
                      );
                    })}
                  </Box>

                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mb: 1.5, alignItems: { md: 'center' } }}>
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 96 }}>
                      Custom Size:
                    </Typography>
                    <TextField
                      size="small"
                      placeholder="e.g. 42 or XS/P"
                      value={customSizeInputs[delivery.id] ?? ''}
                      onChange={(e) => setCustomSizeInputs((prev) => ({ ...prev, [delivery.id]: e.target.value }))}
                      sx={{ width: { xs: '100%', md: 180 } }}
                    />
                    <Button size="small" variant="outlined" onClick={() => addCustomSize(delivery.id)}>
                      Add Size
                    </Button>
                  </Stack>

                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Color</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="right">Unit Price</TableCell>
                          {delivery.sizes.map((size) => (
                            <TableCell key={size} sx={{ fontWeight: 700 }} align="right">{size}</TableCell>
                          ))}
                          <TableCell sx={{ fontWeight: 700 }} align="right">Total Qty</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="right">Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {delivery.colorEntries.map((entry) => {
                          const rowQty = delivery.sizes.reduce((sum, size) => sum + Number(entry.sizeQuantities[size] || 0), 0);
                          const rowAmount = rowQty * Number(entry.unitPrice || 0);

                          return (
                            <TableRow key={entry.id}>
                              <TableCell>
                                <TextField
                                  size="small"
                                  value={entry.color}
                                  onChange={(e) => updateColorField(delivery.id, entry.id, 'color', e.target.value)}
                                  placeholder="Color"
                                />
                              </TableCell>
                              <TableCell align="right">
                                <TextField
                                  size="small"
                                  type="number"
                                  value={entry.unitPrice}
                                  onChange={(e) => updateColorField(delivery.id, entry.id, 'unitPrice', e.target.value)}
                                  inputProps={{ min: 0, step: '0.01', style: { textAlign: 'right' } }}
                                  sx={{ width: 95 }}
                                />
                              </TableCell>
                              {delivery.sizes.map((size) => (
                                <TableCell key={size} align="right">
                                  <TextField
                                    size="small"
                                    type="number"
                                    value={entry.sizeQuantities[size] || 0}
                                    onChange={(e) => updateColorQty(delivery.id, entry.id, size, e.target.value)}
                                    inputProps={{ min: 0, style: { textAlign: 'right' } }}
                                    sx={{ width: 82 }}
                                  />
                                </TableCell>
                              ))}
                              <TableCell align="right" sx={{ fontWeight: 600 }}>{rowQty}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600 }}>
                                {orderInfo.currency} {rowAmount.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Stack direction="row" justifyContent="space-between" sx={{ mt: 1.5 }}>
                    <Button size="small" onClick={() => addColor(delivery.id)}>
                      Add Color
                    </Button>
                    <Typography variant="body2" color="text.secondary">
                      Delivery {index + 1}: Qty {groupTotalQty} | Amount {orderInfo.currency} {groupTotalAmount.toFixed(2)}
                    </Typography>
                  </Stack>
                </Paper>
              );
            })}

            <Button variant="outlined" onClick={addDelivery}>
              Add Delivery Split
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions
          sx={{
            position: 'sticky',
            bottom: 0,
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            py: 1.25,
            px: 2,
            justifyContent: 'space-between',
          }}
        >
          <Stack direction="column" spacing={0.5}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              Totals: Qty {actualTotal} | Amount {orderInfo.currency} {totalAmount.toFixed(2)}
            </Typography>
            {hasMismatch && (
              <Alert severity="warning" sx={{ py: 0 }}>
                Target and Actual quantities do not match. Review is disabled until they match.
              </Alert>
            )}
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button onClick={() => setOpenCreateOrder(false)} disabled={submitting}>Close</Button>
            <Button onClick={resetForm} disabled={submitting}>Reset</Button>
            <Button variant="outlined" onClick={() => void saveDraft()} disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Draft'}
            </Button>
            <Button variant="contained" disabled={hasMismatch || submitting} onClick={() => void reviewOrder()}>
              {submitting ? 'Submitting...' : 'Review'}
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
