import { useState, useMemo } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableSortLabel,
    TablePagination,
    Box,
    Typography,
    Card,
    Checkbox,
    IconButton,
    Menu,
    MenuItem,
    Chip,
    Avatar,
    Button,
    Stack,
} from '@mui/material';
import {
    MoreVert as MoreIcon,
    FileDownload as ExportIcon,
    Visibility as ViewIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import { SmartSkeleton } from './SmartLoading';

export const EnterpriseDataTable = ({
    title,
    data = [],
    columns = [],
    loading = false,
    selectable = false,
    exportable = false,
    onRowClick,
    onExport,
    actions = [],
    pageSize = 10,
    emptyMessage = "No data available",
    emptyDescription = "There are no items to display at this time.",
}) => {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(pageSize);
    const [orderBy, setOrderBy] = useState('');
    const [order, setOrder] = useState('asc');
    const [selected, setSelected] = useState([]);
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [menuRow, setMenuRow] = useState(null);

    // Sorting logic
    const sortedData = useMemo(() => {
        if (!orderBy) return data;
        
        return [...data].sort((a, b) => {
            const aValue = a[orderBy];
            const bValue = b[orderBy];
            
            if (aValue < bValue) return order === 'asc' ? -1 : 1;
            if (aValue > bValue) return order === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data, orderBy, order]);

    // Pagination
    const paginatedData = useMemo(() => {
        const start = page * rowsPerPage;
        return sortedData.slice(start, start + rowsPerPage);
    }, [sortedData, page, rowsPerPage]);

    const handleSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const handleSelectAll = (event) => {
        if (event.target.checked) {
            setSelected(data.map(row => row.id));
        } else {
            setSelected([]);
        }
    };

    const handleSelect = (id) => {
        const selectedIndex = selected.indexOf(id);
        let newSelected = [];

        if (selectedIndex === -1) {
            newSelected = newSelected.concat(selected, id);
        } else if (selectedIndex === 0) {
            newSelected = newSelected.concat(selected.slice(1));
        } else if (selectedIndex === selected.length - 1) {
            newSelected = newSelected.concat(selected.slice(0, -1));
        } else if (selectedIndex > 0) {
            newSelected = newSelected.concat(
                selected.slice(0, selectedIndex),
                selected.slice(selectedIndex + 1),
            );
        }

        setSelected(newSelected);
    };

    const handleMenuOpen = (event, row) => {
        setMenuAnchor(event.currentTarget);
        setMenuRow(row);
    };

    const handleMenuClose = () => {
        setMenuAnchor(null);
        setMenuRow(null);
    };

    const isSelected = (id) => selected.indexOf(id) !== -1;

    if (loading) {
        return <SmartSkeleton type="table" count={1} />;
    }

    return (
        <Card sx={{ border: '1px solid #E4E7EB', borderRadius: 3, overflow: 'hidden' }}>
            {/* Header */}
            <Box sx={{ p: 4, pb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827', mb: 0.5 }}>
                        {title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6B7280' }}>
                        {data.length} total items
                        {selected.length > 0 && ` • ${selected.length} selected`}
                    </Typography>
                </Box>
                
                <Stack direction="row" spacing={2}>
                    {selected.length > 0 && (
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={() => setSelected([])}
                        >
                            Clear selection
                        </Button>
                    )}
                    {exportable && (
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<ExportIcon sx={{ fontSize: 16 }} />}
                            onClick={() => onExport?.(selected.length > 0 ? selected : data)}
                        >
                            Export
                        </Button>
                    )}
                </Stack>
            </Box>

            {/* Table */}
            {data.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography variant="h6" sx={{ color: '#6B7280', mb: 1 }}>
                        {emptyMessage}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#9DA4AE' }}>
                        {emptyDescription}
                    </Typography>
                </Box>
            ) : (
                <TableContainer>
                    <Table className="premium-table">
                        <TableHead>
                            <TableRow>
                                {selectable && (
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            indeterminate={selected.length > 0 && selected.length < data.length}
                                            checked={data.length > 0 && selected.length === data.length}
                                            onChange={handleSelectAll}
                                        />
                                    </TableCell>
                                )}
                                {columns.map((column) => (
                                    <TableCell
                                        key={column.key}
                                        sortDirection={orderBy === column.key ? order : false}
                                    >
                                        {column.sortable !== false ? (
                                            <TableSortLabel
                                                active={orderBy === column.key}
                                                direction={orderBy === column.key ? order : 'asc'}
                                                onClick={() => handleSort(column.key)}
                                            >
                                                {column.label}
                                            </TableSortLabel>
                                        ) : (
                                            column.label
                                        )}
                                    </TableCell>
                                ))}
                                {actions.length > 0 && (
                                    <TableCell align="right">Actions</TableCell>
                                )}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedData.map((row, index) => {
                                const isItemSelected = isSelected(row.id);
                                
                                return (
                                    <TableRow
                                        key={row.id || index}
                                        selected={isItemSelected}
                                        hover
                                        onClick={() => onRowClick?.(row)}
                                        sx={{
                                            cursor: onRowClick ? 'pointer' : 'default',
                                            '&:hover': {
                                                backgroundColor: '#FAFBFC',
                                            },
                                        }}
                                    >
                                        {selectable && (
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    checked={isItemSelected}
                                                    onChange={() => handleSelect(row.id)}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </TableCell>
                                        )}
                                        {columns.map((column) => (
                                            <TableCell key={column.key}>
                                                {column.render ? column.render(row) : row[column.key]}
                                            </TableCell>
                                        ))}
                                        {actions.length > 0 && (
                                            <TableCell align="right">
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleMenuOpen(e, row);
                                                    }}
                                                >
                                                    <MoreIcon sx={{ fontSize: 16 }} />
                                                </IconButton>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Pagination */}
            {data.length > rowsPerPage && (
                <TablePagination
                    component="div"
                    count={data.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(_, newPage) => setPage(newPage)}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                    }}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                />
            )}

            {/* Action Menu */}
            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={handleMenuClose}
                PaperProps={{
                    sx: {
                        border: '1px solid #E4E7EB',
                        borderRadius: 2,
                        minWidth: 160,
                    },
                }}
            >
                {actions.map((action, index) => (
                    <MenuItem
                        key={index}
                        onClick={() => {
                            action.onClick?.(menuRow);
                            handleMenuClose();
                        }}
                        sx={{ fontSize: '0.875rem', py: 1.5 }}
                    >
                        {action.icon && (
                            <Box sx={{ mr: 2, color: '#6B7280' }}>
                                {action.icon}
                            </Box>
                        )}
                        {action.label}
                    </MenuItem>
                ))}
            </Menu>
        </Card>
    );
};
