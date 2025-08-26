import React, { useState, useEffect, useMemo } from 'react';
import { Search, Package, ShoppingCart, SortAsc, ArrowUp, ArrowDown, Filter, Download, Calendar } from 'lucide-react';
import Papa from 'papaparse';
import './App.css';

const ProductInventoryApp = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('desc');
  const [sortColumn, setSortColumn] = useState('quantity');
  const [selectedDate, setSelectedDate] = useState('2025-08-26');

  useEffect(() => {
    const loadCSV = async () => {
      try {
        // Browser-friendly shim for window.fs.readFile
        const response = await fetch('/urunler.csv');
        if (!response.ok) throw new Error('CSV dosyası bulunamadı.');
        const data = await response.text();

        Papa.parse(data, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: false,
          complete: (results) => {
            const processedProducts = results.data
              .map((row, index) => {
                const productName = row['ürün'] || row['Ürün'] || '';
                const quantity = row['miktar'] || row['Miktar'] || '';

                return {
                  id: index + 1, // Each row gets a unique ID
                  name: (productName || '').trim(),
                  quantity: (quantity || '').trim(),
                  originalQuantity: (quantity || '').trim(),
                  date: '2025-08-26', // Default date for all orders
                  // Create a unique key for sorting and identification
                  uniqueKey: `${(productName || '').trim()}-${(quantity || '').trim()}`,
                };
              })
              .filter((product) => product.name && product.quantity);

            setProducts(processedProducts);
            setLoading(false);
          },
          error: (error) => {
            setError('CSV dosyası okunurken hata oluştu: ' + error.message);
            setLoading(false);
          },
        });
      } catch (err) {
        setError('Dosya yüklenirken hata oluştu: ' + err.message);
        setLoading(false);
      }
    };

    loadCSV();
  }, []);

  const handleSort = (column) => {
    if (sortColumn === column) {
      if (sortBy === 'asc') setSortBy('desc');
      else if (sortBy === 'desc') setSortBy('none');
      else setSortBy('asc');
    } else {
      setSortColumn(column);
      setSortBy('asc');
    }
  };

  const getSortIcon = (column) => {
    if (sortColumn !== column) return <SortAsc className="h-3 w-3 text-gray-400" />;
    if (sortBy === 'asc') return <ArrowUp className="h-3 w-3 text-blue-600" />;
    if (sortBy === 'desc') return <ArrowDown className="h-3 w-3 text-blue-600" />;
    return <SortAsc className="h-3 w-3 text-gray-400" />;
  };

  const parseQuantity = (quantityStr) => {
    const numbers = String(quantityStr || '').match(/\d+/g);
    if (!numbers) return 0;
    return numbers.reduce((sum, num) => sum + parseInt(num, 10), 0);
  };

  const getUnit = (quantityStr) => {
    const units = String(quantityStr || '').match(/(?:kg|kasa|adet|paket|demet|bağ|çubuk|tane|çuval|salkım)/gi);
    return units ? units[0] : 'adet';
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const downloadExcel = () => {
    const csvContent = filteredProducts.map(product => ({
      'tarih': formatDate(product.date),
      'ürün': product.name,
      'birim': getUnit(product.quantity),
      'miktar': parseQuantity(product.quantity)
    }));

    const csv = Papa.unparse(csvContent);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'siparisler.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Filter by selected date
    filtered = filtered.filter(product => product.date === selectedDate);

    if (searchTerm) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Group products by name and unit to combine quantities
    const groupedProducts = {};
    filtered.forEach(product => {
      const key = `${product.name}-${product.quantity}`;
      if (groupedProducts[key]) {
        // If same product with same unit exists, combine quantities
        const existingQuantity = parseQuantity(groupedProducts[key].quantity);
        const newQuantity = parseQuantity(product.quantity);
        const combinedQuantity = existingQuantity + newQuantity;
        const unit = getUnit(product.quantity);
        groupedProducts[key].quantity = `${combinedQuantity} ${unit}`;
        groupedProducts[key].originalQuantity = `${combinedQuantity} ${unit}`;
      } else {
        groupedProducts[key] = { ...product };
      }
    });

    // Convert back to array
    filtered = Object.values(groupedProducts);

    // Add duplicate count information
    const nameCounts = {};
    filtered.forEach(product => {
      nameCounts[product.name] = (nameCounts[product.name] || 0) + 1;
    });

    filtered = filtered.map(product => ({
      ...product,
      duplicateCount: nameCounts[product.name],
      isDuplicate: nameCounts[product.name] > 1
    }));

    if (sortBy !== 'none') {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;
        
        if (sortColumn === 'name') {
          comparison = a.name.toLowerCase().localeCompare(b.name.toLowerCase(), 'tr');
        } else if (sortColumn === 'quantity') {
          comparison = parseQuantity(a.quantity) - parseQuantity(b.quantity);
        }
        
        return sortBy === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [products, searchTerm, sortBy, sortColumn, selectedDate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Ürünler yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md mx-4">
          <div className="text-red-500 text-center">
            <Package className="h-12 w-12 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Hata Oluştu</h2>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex flex-col">
      <div className="bg-white shadow-lg flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ShoppingCart className="h-6 w-6 text-green-600" />
              <h1 className="text-xl font-bold text-gray-900">Siparişler</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-green-100 px-3 py-1 rounded-full">
                <span className="text-green-800 font-semibold text-sm">
                  Toplam {products.length} Ürün
                </span>
              </div>
              <button
                onClick={downloadExcel}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Download className="h-4 w-4" />
                Excel İndir
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex-shrink-0">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm text-sm text-gray-900"
              />
            </div>
            <div className="text-sm font-medium text-gray-700">
              {formatDate(selectedDate)}
            </div>
          </div>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Ürün ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm text-sm text-gray-900 placeholder-gray-500"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Filter className="h-3 w-3" />
            <span>Filtrelenmiş: {filteredProducts.length} ürün</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4 flex-1 flex flex-col">
        {filteredProducts.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'Ürün bulunamadı' : 'Bu tarihte ürün yok'}
              </h3>
              <p className="text-gray-500">
                {searchTerm ? 'Arama kriterlerinize uygun ürün bulunamadı.' : `${formatDate(selectedDate)} tarihinde sipariş bulunamadı.`}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 flex flex-col flex-1">
            {/* Table Header */}
            <div className="bg-gray-50 border-b border-gray-200 flex-shrink-0 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-2 text-xs font-semibold text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    <span>Ürün Adı</span>
                    {getSortIcon('name')}
                  </button>
                  <button
                    onClick={() => handleSort('quantity')}
                    className="flex items-center gap-2 text-xs font-semibold text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    <span>Miktar</span>
                    {getSortIcon('quantity')}
                  </button>
                </div>
                <div className="text-xs text-gray-500">
                  <span className="font-medium">{formatDate(selectedDate)}</span>
                </div>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-200 flex-1 overflow-y-auto">
              {filteredProducts.map((product, index) => {
                const totalQuantity = parseQuantity(product.quantity);
                const unit = getUnit(product.quantity);

                return (
                  <div
                    key={product.uniqueKey}
                    className={`grid grid-cols-12 gap-4 px-4 py-2 hover:bg-blue-50 transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <div className="col-span-8 flex items-center">
                      <div className="flex items-center gap-2">
                        <Package className="h-3 w-3 text-green-500 flex-shrink-0" />
                        <span className="text-xs font-medium text-gray-900">
                          {product.name}
                        </span>
                        {product.isDuplicate && (
                          <span className="bg-orange-100 text-orange-800 text-xs px-1.5 py-0.5 rounded-full font-medium">
                            {product.duplicateCount} farklı birim
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="col-span-4 flex items-center justify-end">
                      <span className="text-xs font-semibold text-green-700">
                        {product.quantity}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Table Footer */}
            <div className="bg-gray-50 border-t border-gray-200 px-4 py-3 flex-shrink-0">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <div className="flex items-center gap-4">
                  <span>Toplam {filteredProducts.length} ürün gösteriliyor</span>
                  {(() => {
                    const uniqueProducts = new Set(filteredProducts.map(p => p.name)).size;
                    if (uniqueProducts !== filteredProducts.length) {
                      return (
                        <span className="text-orange-600">
                          ({uniqueProducts} farklı ürün)
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>
                <span>
                  {sortBy !== 'none' && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                      {sortColumn === 'name' ? 'İsme göre' : 'Miktara göre'} 
                      {sortBy === 'asc' ? ' (A-Z)' : ' (Z-A)'}
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {searchTerm && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
          <div className="text-center text-xs text-gray-600">
            <span className="bg-white px-3 py-1 rounded-full shadow-sm">
              "{searchTerm}" için {filteredProducts.length} sonuç bulundu
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductInventoryApp;
