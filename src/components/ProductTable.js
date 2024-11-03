import React, { useEffect, useState } from 'react';
import { Table, Checkbox, Divider, Button, Modal, Select, Card, } from 'antd';
import { useForm, Controller, } from 'react-hook-form';
import './Table.css';

const { Option } = Select;

const ProductTable = ({ product, providers, providerPrice, showCheckboxes, highlightItems, urlId, products }) => {
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [selectedItems, setSelectedItems] = useState({});
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedCellData, setSelectedCellData] = useState(null);
  const [providerName, setProviderName] = useState('');
  const [foundedId, setFoundedId] = useState(null);
  const [foundedSubId, setFoundedSubId] = useState(null);







  const { control, handleSubmit, setValue, reset, watch } = useForm({
    defaultValues: {
      quantity: '',
      price: '',
      totalPrice: '',
      finalPricePerUnit: '',
      finalTotalPrice: '',
      discount: '',
      currency: 'یورو',
      supplyType: 'رسمی',
      category: 'محصول',
      paymentTerms: '',
    },
  });

  const handleSelect = (providerId, rowKey, e) => {
    e.stopPropagation();
    setSelectedItems((prevSelected) => {
      const updatedProviderSelections = prevSelected[providerId] || [];
      const isSelected = updatedProviderSelections.includes(rowKey);
      return {
        ...prevSelected,
        [providerId]: isSelected
          ? updatedProviderSelections.filter((key) => key !== rowKey)
          : [...updatedProviderSelections, rowKey],
      };
    });
  };

  const handleSelectAll = (providerId, checked, e) => {
    e.stopPropagation();
    if (checked) {
      setSelectedItems((prevSelected) => ({
        ...prevSelected,
        [providerId]: data.map((item) => item.key),
      }));
    } else {
      setSelectedItems((prevSelected) => ({
        ...prevSelected,
        [providerId]: [],
      }));
    }
  };

  const toPersianNumber = (num) => {
    if (num === null || num === undefined) {
      return '';
    }
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    return num.toString().replace(/\d/g, (digit) => persianDigits[digit]);
  };

  useEffect(() => {
    if (!product || !product.items) {
      return;
    }

    const dataSource = [];

    product.items.forEach((item, itemIndex) => {
      dataSource.push({
        key: `item-${itemIndex}`,
        rowNumber: itemIndex + 1,
        name: item.title,
        partNumber: item.partNumber,
        quantity: item.quantity,
        unit: item.unit,
        title: item.title,
        comment: item.comment,
        isSubItem: false,
        productDetails: item,
        lomQuantity: item.lomQuantity,
        providers:
          providerPrice.find((price) => price.supplyProductId === item.supplyProductId)
            ?.providers || [],
      });

      if (item.subItems && item.subItems.length > 0) {
        item.subItems.forEach((subItem, subItemIndex) => {
          dataSource.push({
            key: `item-${itemIndex}-subItem-${subItemIndex}`,
            rowNumber: `${itemIndex + 1}-${subItemIndex + 1}`,
            name: subItem.title,
            title: item.title,
            partNumber: subItem.partNumber,
            quantity: subItem.quantity,
            unit: subItem.unit,
            comment: '',
            isSubItem: true,
            productDetails: subItem,
            lomQuantity: subItem.lomQuantity,
            providers:
              providerPrice.find((price) => price.supplyProductId === subItem.supplyProductId)
                ?.providers || [],
          });
        });
      }
    });

    setData(dataSource);

    const allProviders = providerPrice.flatMap((price) => price.providers || []);
    const uniqueProviders = [];

    allProviders.forEach((provider) => {
      if (!uniqueProviders.some((p) => p.provider.id === provider.provider.id)) {
        uniqueProviders.push(provider);
      }
    });

    const dynamicColumns = uniqueProviders.map((provider, index) => ({
      title: (
        <div>
          {showCheckboxes && (
            <Checkbox
              style={{ display: 'flex', marginRight: '95%' }}
              onChange={(e) => handleSelectAll(provider.provider.id, e.target.checked, e)}
              checked={
                selectedItems[provider.provider.id]?.length === dataSource.length &&
                dataSource.length > 0
              }
            />
          )}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span>نام: {provider.provider.name}</span>
            <span>اسناد پیش فروش: -</span>
            <span>خروجی تامین کننده: -</span>
          </div>
        </div>
      ),

      dataIndex: `provider_${index}`,
      key: `provider_${index}`,
      align: 'center',
      render: (_, record) => {
        const providerDetails = record.providers.find(
          (p) => p.provider.id === provider.provider.id
        );

        const selected = selectedItems[provider.provider.id]?.includes(record.key) || false;
        const onSelect = (e) => handleSelect(provider.provider.id, record.key, e);

        return (
          <div>
            {providerDetails ? (
              <>
                {showCheckboxes && (
                  <Checkbox
                    style={{ marginRight: '95%' }}
                    checked={selected}
                    onChange={onSelect}
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
                <div> نوع ارز: {providerDetails.currency}</div>
                <div>وضعیت کالا: {providerDetails.productStatus?.title || '-'}</div>
                <div>تعداد تایید شده: {toPersianNumber(providerDetails.quantity)}</div>
                <div>درصد تخفیف: {toPersianNumber(providerDetails.discount)}</div>
                <div>قیمت واحد نهایی: {toPersianNumber(providerDetails.price)}</div>
                <div>
                  قیمت کل نهایی: {toPersianNumber(providerDetails.price * providerDetails.quantity)}
                </div>
              </>
            ) : (
              <span>اطلاعاتی موجود نیست</span>
            )}
          </div>
        );
      },
      onCell: (record) => ({
        onClick: () => handleCellClick(record, provider, product, providerPrice),
        style: { cursor: 'pointer' },
      }),
      summary: () => {
        const totalByCurrency = {};

        providerPrice.forEach((pro) => {
          pro.providers.forEach((provider) => {
            const providerId = provider.provider.id;

            const currencyTotals = calculateTotalPriceByProvider(pro.provider?.id, providerId);

            Object.keys(currencyTotals).forEach((currency) => {
              if (!totalByCurrency[currency]) {
                totalByCurrency[currency] = currencyTotals[currency];
              } else {
              }
            });
          });
        });

        const selectedCurrencies = ['USD', 'AED', 'EUR'];

        return (
          <Table.Summary.Row>
            {selectedCurrencies.map((currency, index) => (
              <Table.Summary.Cell key={index} align="center">
                <div
                  style={{
                    textAlign: 'center',
                    fontWeight: 'bold',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '100%',
                  }}
                >
                  <div
                    style={{
                      width: 125,
                      height: 45,
                      border: '2px solid orange',
                      borderRadius: 6,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    {currency}: {toPersianNumber(totalByCurrency[currency] || 0)}
                  </div>
                </div>
              </Table.Summary.Cell>
            ))}
          </Table.Summary.Row>
        );
      },

    }
    ));


    const staticColumns = [
      {
        title: '#',
        dataIndex: 'rowNumber',
        key: 'rowNumber',
        width: '8%',
        align: 'center',
        className: 'row-number-column',
        onCell: () => ({
          style: { background: 'rgba(242, 242, 242, 1)' },
        }),
      },
      {
        title: (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            <span>تامین کننده</span>
            <Divider type="horizontal" />
            <span>محصولات</span>
          </div>
        ),
        dataIndex: 'name',
        key: 'name',
        width: '20%',
        onCell: (record) => ({
          style: {
            background: record.productDetails.supplyProductId === highlightItems
              ? 'yellow'
              : 'rgba(242, 242, 242, 1)',
            cursor: 'pointer',
          },
        }),
        render: (_, record) => (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-start',
              flexDirection: 'column',
            }}
          >
            <div style={{ marginLeft: record.isSubItem ? '20px' : '0' }}>
              عنوان کالا: {record.name}
            </div>
            <div style={{ marginLeft: record.isSubItem ? '20px' : '0' }}>نوع: -</div>
            <div style={{ marginLeft: record.isSubItem ? '20px' : '0' }}>
              پارت نامبر: {record.partNumber}
            </div>
            <div style={{ marginLeft: record.isSubItem ? '20px' : '0' }}>
              تعداد تایید شده: {toPersianNumber(record.lomQuantity)} /{' '}
              {toPersianNumber(record.quantity)}
            </div>
          </div>
        ),
      }



    ];

    setColumns([...staticColumns, ...dynamicColumns]);
  }, [product, providers, providerPrice, selectedItems, showCheckboxes, highlightItems]);

  const quantity = watch("quantity");
  const price = watch("price");
  const discount = watch("discount");

  useEffect(() => {
    const updatedTotalPrice = quantity && price ? quantity * price : 0;
    const updatedFinalPricePerUnit = discount ? price * (1 - discount / 100) : price;
    const updatedFinalTotalPrice = quantity ? updatedFinalPricePerUnit * quantity : 0;

    setValue("totalPrice", updatedTotalPrice);
    setValue("finalPricePerUnit", updatedFinalPricePerUnit);
    setValue("finalTotalPrice", updatedFinalTotalPrice);
  }, [quantity, price, discount, setValue]);

  const handleCellClick = (record, column) => {
    setSelectedCellData({ record, column });
    console.log(selectedCellData);

    if (typeof column !== 'string') {
      const providerDetails = record.providers?.find(
        (provider) => provider?.provider.id === column.provider?.id
      );

      if (product) {
        console.log(record)
        if (record) {
          const similarPartNumbers = product?.items?.filter(
            (part) => part.partNumber && part.partNumber.includes(record.partNumber)
          );






          if (similarPartNumbers && similarPartNumbers.length > 0) {
            console.log('Similar part numbers found:', similarPartNumbers);
            setFoundedId(similarPartNumbers[0]?.supplyProductId)
            console.log(foundedId)

            const foundSet = products.find(product =>
              product.items?.some(item => item?.supplyProductId === foundedId)
            )

            console.log(foundSet)


          } else {
            console.log('Checking for similar sub items...');
            console.log('Product:', record.product);

            let foundSimilarSubItems = false;
            product?.items?.forEach(prod => {
              if (prod.subItems) {
                const similarSubItems = prod.subItems.filter(
                  (sub) => sub.partNumber && sub.partNumber.includes(record.partNumber)
                );

                if (similarSubItems.length > 1) {
                  console.log('Similar sub items found:', similarSubItems);
                  setFoundedSubId(similarSubItems[1]?.supplyProductId)
                  console.log(foundedSubId)

                  const foundSet = products.find(product =>
                    product.items?.some(item =>
                      item.subItems?.some(subItem => subItem.supplyProductId === foundedSubId)
                    )
                  );

                  console.log(foundSet?.id)

                  foundSimilarSubItems = true;
                }
              }
            });

            if (!foundSimilarSubItems) {
              console.log('No similar sub items found.');
            }
          }
        }

        if (providerDetails) {
          setValue('quantity', providerDetails.quantity);
          setValue('price', providerDetails.price);
          setValue('totalPrice', providerDetails.price * providerDetails.quantity);
          setValue('finalPricePerUnit', providerDetails.price * (1 - providerDetails.discount / 100));
          setValue('finalTotalPrice', providerDetails.price * (1 - providerDetails.discount / 100) * providerDetails.quantity);
          setValue('discount', providerDetails.discount);
          setValue('currency', providerDetails.currency || 'یورو');
          setValue('supplyType', providerDetails.supplyType || 'رسمی');
          setValue('category', providerDetails.category || 'محصول');
          setValue('paymentTerms', providerDetails.paymentTerms || '');
          setValue('providerName', providerDetails.provider.name);
          setValue('providerPriceId', providerDetails?.id);
          setValue('finalConfirmId', providerDetails.finalConfirmId);
          setValue('supplyId', providerDetails.supplyProductId);
          setValue('providerId', providerDetails.provider?.id);
          setValue('supplyTypeId', providerDetails.supplyType?.id);
        } else {
          console.log('Invalid provider details or record.');
          reset();
        }


      }
      setIsModalVisible(true);
    }
  };



  const handleModalOk = async (data) => {
    console.log('Form values:', data);

    const formData = {
      prvPrcDtlId: data.providerPriceId,
      finalConfirmId: data.finalConfirmId,
      supplyProductId: data.supplyId,
      providerId: data.providerId,
      supplyRequestId: urlId,
      supplyTypeId: data.supplyTypeId,
      totalPrice: data.totalPrice,
      price: data.price,
      discountPercent: data.discount,
      quantity: data.quantity,
      // supplyType: data.supplyType,
      supplyCategoryId: 0,
      termsOfPayment: data.paymentTerms,
      priceType: 1,
    };

    try {
      const response = await fetch('http://api.sepehrdev.pardis/api/Supply/Providers/Confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const result = await response.json();
      console.log('Success:', result);
    } catch (error) {
      console.error('Error:', error);
    }

    setIsModalVisible(false);
    setSelectedCellData(null);
    setProviderName('');
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setSelectedCellData(null);
    reset();
  };

  const calculateTotalPriceByProvider = (proId, providerId) => {
    const totalByCurrency = {};

    data.forEach((item) => {
      const providerDetails = item.providers.find(
        (p) => p.provider.id === providerId
      );


      if (providerDetails && selectedItems[providerId]?.includes(item.key)) {
        const { currency, price, quantity } = providerDetails;
        const itemTotal = price * quantity;

        if (totalByCurrency[currency]) {
          totalByCurrency[currency] += itemTotal;
        } else {
          totalByCurrency[currency] = itemTotal;
        }
      }
    });

    return totalByCurrency;
  };

  const calculateTotalPriceByCurrency = () => {
    let totalEUR = 0;
    let totalUSD = 0;

    data.forEach((item) => {
      item.providers.forEach((providerDetails) => {
        if (selectedItems[providerDetails.provider.id]?.includes(item.key)) {
          if (providerDetails.currency === 'EUR') {
            totalEUR += providerDetails.price * providerDetails.quantity;
          } else if (providerDetails.currency === 'USD') {
            totalUSD += providerDetails.price * providerDetails.quantity;
          }
        }
      });
    });

    return { totalEUR, totalUSD };
  };

  const totals = calculateTotalPriceByCurrency();


  return (
    <>

      <Table
        columns={columns}
        dataSource={data}
        pagination={false}
        className="custom-table"
        bordered
        summary={(pageData) => {
          return (
            <Table.Summary.Row>
              {columns.map((column, index) => (
                <Table.Summary.Cell key={index} align="center">
                  {column.summary ? column.summary() : null}
                </Table.Summary.Cell>
              ))}
              <Table.Summary.Cell align="center">
                <div>
                  <div>EUR: {toPersianNumber(totals.totalEUR)}</div>
                  <div>USD: {toPersianNumber(totals.totalUSD)}</div>
                </div>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          );
        }}
      />
      <div style={{ marginTop: 20 }}>
        <div
          style={{
            width: 150,
            height: 100,
            border: '1px solid orange',
            borderRadius: 6,
            textAlign: 'center',
          }}
          className="ant-body2"
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: 8,
            }}
          >
            <span>یورو :</span> {toPersianNumber(totals.totalEUR)}
          </div>
          <Divider
            type="horizontal"
            style={{ borderColor: 'orange' }}
            className="divider"
          />
          <div
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
          >
            <span>دلار :</span> {toPersianNumber(totals.totalUSD)}
          </div>
        </div>
      </div>
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          marginBottom: 20,
          alignItems: 'center',
        }}
      >
        <Button
          type="primary"
          style={{
            backgroundColor: '#14B8A6',
            borderColor: '#14B8A6',
            color: '#fff',
            width: '120px',
            height: '40px',
            fontWeight: 'bold',
            borderRadius: '6px',
          }}
        >
          تایید نهایی
        </Button>
      </div>
      <Modal
        title="تایید قیمت نهایی"
        visible={isModalVisible}
        onOk={handleSubmit(handleModalOk)}
        onCancel={handleModalCancel}
        footer={null}

        style={{ minWidth: 800 }}
      >
        <Card>
          <div style={{ display: 'flex', flexDirection: 'row', marginBottom: 20 }}>
            <p style={{ marginLeft: 25 }}> تامین کننده : {providerName}</p>
            <p>ثبت کننده قیمت : -</p>
          </div>
          <div style={{ width: "100%", border: '1px solid orange', direction: "rtl" }}>
            <p>پارت نامبر های مشابه : </p>
          </div>
          <form className="price-confirmation-form">
            <div className="form-row">
              <div className="form-group">
                <label className='ant-label'>تعداد</label>
                <Controller
                  name="quantity"
                  control={control}
                  render={({ field }) => (
                    <input className="ant-input" {...field} type="number" />
                  )}
                />
              </div>
              <div className="form-group">
                <label className='ant-label'>قیمت واحد</label>
                <Controller
                  name="price"
                  control={control}
                  render={({ field }) => (
                    <input className="ant-input" {...field} type="number" />
                  )}
                />
              </div>
              <div className="form-group">
                <label className='ant-label'>قیمت کل</label>
                <Controller
                  name="totalPrice"
                  control={control}
                  render={({ field }) => (
                    <input className="ant-input" {...field} type="number" disabled />
                  )}
                />
              </div>
            </div>

            <div className="form-row">

              <div className="form-group">
                <label className='ant-label'>درصد تخفیف</label>
                <Controller
                  name="discount"
                  control={control}
                  render={({ field }) => (
                    <input className="ant-input" {...field} type="number" />
                  )}
                />
              </div>
              <div className="form-group">
                <label className='ant-label'>قیمت واحد نهایی</label>
                <Controller
                  name="finalPricePerUnit"
                  control={control}
                  render={({ field }) => (
                    <input className="ant-input" {...field} type="number" disabled />
                  )}
                />
              </div>
              <div className="form-group">
                <label className='ant-label'>قیمت کل نهایی</label>
                <Controller
                  name="finalTotalPrice"
                  control={control}
                  render={({ field }) => (
                    <input className="ant-input" {...field} type="number" disabled />
                  )}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className='ant-label'>دسته بندی</label>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} className="ant-select">
                      <Option value="محصول">محصول</Option>
                      <Option value="خدمات">خدمات</Option>
                    </Select>
                  )}
                />
              </div>
              <div className="form-group">
                <label className='ant-label'>نوع تامین</label>
                <Controller
                  name="supplyType"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} className="ant-select" disabled>
                      <Option value="رسمی">رسمی</Option>
                      <Option value="غیر رسمی">غیر رسمی</Option>
                    </Select>
                  )}
                />
              </div>
              <div className="form-group">
                <label className='ant-label'>نوع ارز</label>
                <Controller
                  name="currency"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} className="ant-select" disabled>
                      <Option value="یورو">یورو</Option>
                      <Option value="دلار">دلار</Option>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="form-row">

              <div className="form-group">
                <label className='ant-label'>شرایط پرداخت</label>
                <Controller
                  name="paymentTerms"
                  control={control}
                  render={({ field }) => (
                    <textarea className="ant-input2" {...field} />
                  )}
                />
              </div>
            </div>
          </form>
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              marginBottom: 20,
              alignItems: 'center',
              marginTop: 20
            }}
          >
            <Button
              type="primary"
              style={{
                backgroundColor: '#14B8A6',
                borderColor: '#14B8A6',
                color: '#fff',
                width: '120px',
                height: '40px',
                fontWeight: 'bold',
                borderRadius: '6px',
                margin: '10px',
              }}
              onClick={handleSubmit(handleModalOk)}
            >
              ثبت
            </Button>
            <Button
              type="primary"
              style={{
                backgroundColor: '#9C9C9D',
                color: '#fff',
                width: '120px',
                height: '40px',
                fontWeight: 'bold',
                borderRadius: '6px',
              }}
              onClick={handleModalCancel}
            >
              انصراف
            </Button>
          </div>
        </Card>

      </Modal>
    </>
  );
};

export default ProductTable;
