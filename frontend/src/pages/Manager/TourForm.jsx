import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Formik, Form, Field, FieldArray } from 'formik';
import { toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom';
import { tourAPI } from '../../services/api';
import FormikDateInput from '../../components/FormikDateInput';

const tabs = ['basic', 'details', 'itinerary', 'departures', 'images'];
const tabLabels = {
  basic: 'Thông tin cơ bản',
  details: 'Nội dung bổ sung',
  itinerary: 'Lịch trình',
  departures: 'Ngày khởi hành',
  images: 'Hình ảnh',
};

const categoryOptions = ['Biển', 'Văn hóa', 'Nghỉ dưỡng', 'Thiên nhiên', 'Ẩm thực', 'Gia đình', 'Cao cấp', 'Khám phá'];
const destinationOptions = ['Đà Nẵng', 'Hà Nội', 'Phú Quốc', 'Đà Lạt', 'Huế', 'Quy Nhơn', 'Miền Tây', 'Côn Đảo', 'Mũi Né', 'Sa Pa', 'Nha Trang', 'Hội An'];
const durationOptions = [2, 3, 4, 5, 6, 7];
const maxPaxOptions = [10, 15, 20, 24, 30, 40];
const priceOptions = [2500000, 3500000, 4900000, 6200000, 7900000, 9500000, 12500000];
const bestTimeOptions = ['Tháng 1 đến tháng 4', 'Tháng 3 đến tháng 8', 'Tháng 5 đến tháng 9', 'Tháng 9 đến tháng 12', 'Quanh năm'];
const meetingPointOptions = [
  'Sân bay hoặc điểm hẹn trung tâm theo lịch khởi hành',
  'Khách sạn trung tâm hoặc điểm hẹn theo lịch',
  'Sân bay, bến xe hoặc khách sạn trung tâm theo lịch',
  'Văn phòng công ty du lịch',
  'Điểm hẹn do điều hành thông báo trước ngày khởi hành',
];

function futureDateString(daysFromNow) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().slice(0, 10);
}

const presetGroups = {
  highlights: {
    title: 'Chọn điểm nổi bật',
    options: [
      'Lịch trình cân bằng giữa tham quan và nghỉ ngơi',
      'Khách sạn vị trí thuận tiện',
      'Xe đưa đón riêng theo chương trình',
      'Hướng dẫn viên đồng hành suốt tuyến',
      'Bữa ăn đặc sản địa phương',
      'Điểm check-in nổi bật',
      'Phù hợp nhóm gia đình và công ty',
      'Lịch trình nhẹ nhàng, dễ tham gia',
      'Có thời gian tự do mua sắm và khám phá',
      'Dịch vụ trọn gói, rõ chi phí',
    ],
  },
  local_culture: {
    title: 'Chọn văn hóa địa phương',
    options: [
      'Ẩm thực địa phương phong phú, dễ tiếp cận với nhiều khẩu vị',
      'Người dân thân thiện, phù hợp trải nghiệm giao lưu nhẹ nhàng',
      'Không gian văn hóa gắn với lịch sử và đời sống bản địa',
      'Các khu chợ, phố đi bộ hoặc làng nghề phù hợp khám phá tự do',
      'Nhiều điểm chụp ảnh đặc trưng theo mùa',
      'Có các món đặc sản nên thử trong lịch trình',
    ],
  },
  included_services: {
    title: 'Chọn dịch vụ bao gồm',
    options: [
      'Xe du lịch đời mới phục vụ theo chương trình',
      'Khách sạn tiêu chuẩn theo lịch trình',
      'Các bữa ăn theo chương trình',
      'Vé tham quan theo lịch trình',
      'Hướng dẫn viên tiếng Việt chuyên nghiệp',
      'Nước suối trên xe',
      'Bảo hiểm du lịch',
      'Quà tặng du lịch',
      'Vé cáp treo hoặc tàu theo chương trình',
      'Hỗ trợ check-in và thủ tục đoàn',
    ],
  },
  excluded_services: {
    title: 'Chọn dịch vụ không bao gồm',
    options: [
      'Vé máy bay khứ hồi',
      'Chi phí cá nhân ngoài chương trình',
      'Đồ uống trong các bữa ăn',
      'Phụ thu phòng đơn',
      'VAT',
      'Tiền tip cho hướng dẫn viên và tài xế',
      'Chi phí giặt ủi, điện thoại, minibar',
      'Dịch vụ phát sinh ngoài lịch trình',
      'Chi phí visa hoặc hộ chiếu nếu có',
      'Phụ thu ngày lễ, Tết nếu có',
    ],
  },
  suitable_for: {
    title: 'Chọn đối tượng phù hợp',
    options: [
      'Gia đình',
      'Nhóm bạn',
      'Cặp đôi',
      'Khách công ty',
      'Người lớn tuổi',
      'Trẻ em',
      'Khách thích nghỉ dưỡng',
      'Khách thích khám phá',
      'Khách yêu văn hóa - lịch sử',
      'Khách thích biển đảo',
    ],
  },
  travel_tips: {
    title: 'Chọn lưu ý khi đi tour',
    options: [
      'Mang theo CCCD hoặc hộ chiếu bản gốc',
      'Có mặt tại điểm tập trung trước giờ khởi hành 30 phút',
      'Mang giày thể thao hoặc dép dễ di chuyển',
      'Chuẩn bị kem chống nắng, nón và kính râm',
      'Mang áo khoác nhẹ cho buổi tối',
      'Không tự ý tách đoàn khi chưa báo hướng dẫn viên',
      'Giữ gìn tư trang cá nhân tại nơi đông người',
      'Thông báo trước nếu có yêu cầu ăn chay hoặc dị ứng thực phẩm',
      'Chuẩn bị thuốc cá nhân nếu cần',
      'Tuân thủ quy định tại điểm tham quan',
    ],
  },
};

const quickTourTemplates = [
  {
    id: 'beach-family',
    label: 'Biển nghỉ dưỡng gia đình',
    values: {
      title: 'Nghỉ dưỡng biển trọn gói',
      category: 'Biển',
      destination: 'Đà Nẵng',
      duration_days: 4,
      max_pax: 24,
      price_per_person: 6200000,
      description: 'Hành trình nghỉ dưỡng biển phù hợp gia đình và nhóm bạn, kết hợp tham quan các điểm nổi bật, thưởng thức ẩm thực địa phương và có thời gian tự do để nghỉ ngơi.',
      highlights: ['Khách sạn vị trí thuận tiện', 'Điểm check-in nổi bật', 'Bữa ăn đặc sản địa phương', 'Dịch vụ trọn gói, rõ chi phí'],
      destination_overview: 'Điểm đến có cảnh quan biển đẹp, nhiều điểm tham quan nổi bật và hệ thống dịch vụ du lịch phát triển, phù hợp cho khách muốn nghỉ dưỡng kết hợp khám phá.',
      historical_background: 'Khu vực có quá trình phát triển du lịch lâu năm, kết hợp giữa cảnh quan tự nhiên, văn hóa địa phương và nhịp sống đô thị năng động.',
      local_culture: ['Ẩm thực địa phương phong phú, dễ tiếp cận với nhiều khẩu vị', 'Người dân thân thiện, phù hợp trải nghiệm giao lưu nhẹ nhàng'],
      best_time_to_visit: 'Tháng 3 đến tháng 8',
      weather_notes: 'Nên chuẩn bị kem chống nắng, nón, kính râm và áo khoác nhẹ khi đi biển vào buổi chiều tối.',
      included_services: ['Xe du lịch đời mới phục vụ theo chương trình', 'Khách sạn tiêu chuẩn theo lịch trình', 'Các bữa ăn theo chương trình', 'Vé tham quan theo lịch trình', 'Hướng dẫn viên tiếng Việt chuyên nghiệp', 'Bảo hiểm du lịch'],
      excluded_services: ['Vé máy bay khứ hồi', 'Chi phí cá nhân ngoài chương trình', 'Đồ uống trong các bữa ăn', 'Phụ thu phòng đơn', 'VAT'],
      suitable_for: ['Gia đình', 'Nhóm bạn', 'Cặp đôi', 'Khách thích nghỉ dưỡng', 'Khách thích biển đảo'],
      travel_tips: ['Mang theo CCCD hoặc hộ chiếu bản gốc', 'Có mặt tại điểm tập trung trước giờ khởi hành 30 phút', 'Chuẩn bị kem chống nắng, nón và kính râm', 'Giữ gìn tư trang cá nhân tại nơi đông người'],
      meeting_point: 'Sân bay hoặc điểm hẹn trung tâm theo lịch khởi hành',
      itinerary: [
        { day: 1, title: 'Đón khách và nhận phòng', description: 'Đón khách tại điểm hẹn, di chuyển về khách sạn, nhận phòng và dùng bữa tối địa phương.' },
        { day: 2, title: 'Tham quan điểm nổi bật', description: 'Tham quan các điểm nổi bật trong chương trình, chụp ảnh và thưởng thức đặc sản.' },
        { day: 3, title: 'Nghỉ dưỡng và tự do khám phá', description: 'Thời gian tự do nghỉ ngơi, tắm biển hoặc khám phá khu vực xung quanh.' },
        { day: 4, title: 'Mua sắm và tiễn khách', description: 'Ăn sáng, mua sắm đặc sản, trả phòng và tiễn khách về điểm hẹn.' },
      ],
    },
  },
  {
    id: 'culture-history',
    label: 'Văn hóa - lịch sử',
    values: {
      title: 'Hành trình văn hóa lịch sử',
      category: 'Văn hóa',
      destination: 'Huế',
      duration_days: 3,
      max_pax: 20,
      price_per_person: 4900000,
      description: 'Tour dành cho khách yêu văn hóa, lịch sử và ẩm thực địa phương, lịch trình vừa phải, dễ tham gia và có hướng dẫn viên thuyết minh tại các điểm chính.',
      highlights: ['Lịch trình nhẹ nhàng, dễ tham gia', 'Hướng dẫn viên đồng hành suốt tuyến', 'Bữa ăn đặc sản địa phương', 'Có thời gian tự do mua sắm và khám phá'],
      destination_overview: 'Điểm đến nổi bật với di sản, kiến trúc, ẩm thực và đời sống địa phương đặc sắc, phù hợp cho hành trình tìm hiểu văn hóa.',
      historical_background: 'Khu vực gắn với nhiều dấu ấn lịch sử, công trình kiến trúc và câu chuyện văn hóa được bảo tồn qua nhiều thế hệ.',
      local_culture: ['Không gian văn hóa gắn với lịch sử và đời sống bản địa', 'Có các món đặc sản nên thử trong lịch trình'],
      best_time_to_visit: 'Tháng 1 đến tháng 4 hoặc tháng 9 đến tháng 12',
      weather_notes: 'Nên mang giày dễ đi bộ, áo khoác nhẹ và chuẩn bị dù mỏng trong mùa mưa.',
      included_services: ['Xe du lịch đời mới phục vụ theo chương trình', 'Các bữa ăn theo chương trình', 'Vé tham quan theo lịch trình', 'Hướng dẫn viên tiếng Việt chuyên nghiệp', 'Nước suối trên xe'],
      excluded_services: ['Chi phí cá nhân ngoài chương trình', 'Đồ uống trong các bữa ăn', 'Phụ thu phòng đơn', 'VAT'],
      suitable_for: ['Gia đình', 'Người lớn tuổi', 'Khách yêu văn hóa - lịch sử', 'Khách công ty'],
      travel_tips: ['Mang theo CCCD hoặc hộ chiếu bản gốc', 'Mang giày thể thao hoặc dép dễ di chuyển', 'Tuân thủ quy định tại điểm tham quan', 'Thông báo trước nếu có yêu cầu ăn chay hoặc dị ứng thực phẩm'],
      meeting_point: 'Khách sạn trung tâm hoặc điểm hẹn theo lịch',
      itinerary: [
        { day: 1, title: 'Đón khách và tham quan trung tâm', description: 'Đón khách, dùng bữa trưa và tham quan các điểm văn hóa chính trong trung tâm.' },
        { day: 2, title: 'Khám phá di sản', description: 'Tham quan các công trình lịch sử, nghe thuyết minh và dùng bữa đặc sản địa phương.' },
        { day: 3, title: 'Mua đặc sản và tiễn khách', description: 'Tự do mua sắm, trả phòng và tiễn khách về điểm hẹn.' },
      ],
    },
  },
  {
    id: 'mountain-nature',
    label: 'Thiên nhiên - nghỉ dưỡng núi',
    values: {
      title: 'Nghỉ dưỡng thiên nhiên vùng cao',
      category: 'Thiên nhiên',
      destination: 'Đà Lạt',
      duration_days: 3,
      max_pax: 20,
      price_per_person: 5200000,
      description: 'Hành trình phù hợp khách muốn nghỉ dưỡng trong không khí mát mẻ, tham quan cảnh quan thiên nhiên, thưởng thức đặc sản và có lịch trình không quá dày.',
      highlights: ['Lịch trình cân bằng giữa tham quan và nghỉ ngơi', 'Điểm check-in nổi bật', 'Khách sạn vị trí thuận tiện', 'Lịch trình nhẹ nhàng, dễ tham gia'],
      destination_overview: 'Điểm đến có khí hậu mát mẻ, nhiều cảnh quan thiên nhiên, quán cà phê đẹp và hoạt động nghỉ dưỡng phù hợp nhiều độ tuổi.',
      historical_background: 'Vùng du lịch phát triển từ lâu với dấu ấn kiến trúc, nông nghiệp địa phương và các khu nghỉ dưỡng trên cao nguyên.',
      local_culture: ['Nhiều điểm chụp ảnh đặc trưng theo mùa', 'Các khu chợ, phố đi bộ hoặc làng nghề phù hợp khám phá tự do'],
      best_time_to_visit: 'Tháng 11 đến tháng 4',
      weather_notes: 'Nhiệt độ buổi tối có thể thấp, nên mang áo khoác và giày dễ di chuyển.',
      included_services: ['Xe du lịch đời mới phục vụ theo chương trình', 'Khách sạn tiêu chuẩn theo lịch trình', 'Các bữa ăn theo chương trình', 'Vé tham quan theo lịch trình', 'Hướng dẫn viên tiếng Việt chuyên nghiệp'],
      excluded_services: ['Vé máy bay khứ hồi', 'Chi phí cá nhân ngoài chương trình', 'Đồ uống trong các bữa ăn', 'Phụ thu phòng đơn'],
      suitable_for: ['Gia đình', 'Cặp đôi', 'Người lớn tuổi', 'Khách thích nghỉ dưỡng', 'Khách thích khám phá'],
      travel_tips: ['Mang áo khoác nhẹ cho buổi tối', 'Mang giày thể thao hoặc dép dễ di chuyển', 'Chuẩn bị thuốc cá nhân nếu cần', 'Không tự ý tách đoàn khi chưa báo hướng dẫn viên'],
      meeting_point: 'Sân bay, bến xe hoặc khách sạn trung tâm theo lịch',
      itinerary: [
        { day: 1, title: 'Đón khách và nghỉ dưỡng', description: 'Đón khách, nhận phòng, tham quan nhẹ và dùng bữa tối.' },
        { day: 2, title: 'Khám phá cảnh quan', description: 'Tham quan các điểm thiên nhiên, vườn hoa, nông trại hoặc quán cà phê theo chương trình.' },
        { day: 3, title: 'Tự do mua sắm và tiễn khách', description: 'Mua đặc sản địa phương, trả phòng và tiễn khách.' },
      ],
    },
  },
];

function appendFormData(formData, key, value) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => appendFormData(formData, `${key}[${index}]`, item));
    return;
  }

  if (value && typeof value === 'object') {
    Object.entries(value).forEach(([childKey, childValue]) => {
      appendFormData(formData, `${key}[${childKey}]`, childValue);
    });
    return;
  }

  formData.append(key, value ?? '');
}

function buildTourFormData(values, files) {
  const formData = new FormData();

  Object.entries(values).forEach(([key, value]) => {
    appendFormData(formData, key, value);
  });

  files.forEach((file) => {
    formData.append('image_files[]', file);
  });

  return formData;
}

function formatApiError(error) {
  const message = error?.response?.data?.message;
  const errors = error?.response?.data?.data?.errors;

  if (errors && typeof errors === 'object') {
    const firstError = Object.values(errors).flat().find(Boolean);
    if (firstError) return firstError;
  }

  return message || 'Không thể lưu tour';
}

function PresetPickerPanel({ title, field, values, onOpen, setFieldValue }) {
  const selectedItems = (values[field] || []).filter(Boolean);

  return (
    <div className="rounded-3 border p-3 h-100">
      <div className="d-flex justify-content-between align-items-center gap-2 mb-3">
        <h3 className="h6 mb-0">{title}</h3>
        <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => onOpen(field, values)}>
          Chọn mục
        </button>
      </div>

      {selectedItems.length === 0 ? (
        <div className="rounded-3 border bg-light-subtle p-3 text-muted">Chưa chọn mục nào.</div>
      ) : (
        <div className="d-flex flex-wrap gap-2">
          {selectedItems.map((item) => (
            <span key={item} className="badge rounded-pill text-bg-light border d-inline-flex align-items-center gap-2 px-3 py-2">
              <span>{item}</span>
              <button
                type="button"
                className="btn-close"
                aria-label={`Bỏ ${item}`}
                style={{ fontSize: 10 }}
                onClick={() => setFieldValue(field, selectedItems.filter((value) => value !== item))}
              />
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TourForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('basic');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [presetModal, setPresetModal] = useState(null);
  const [presetSelection, setPresetSelection] = useState([]);

  const { data: editSeed } = useQuery({
    queryKey: ['manager-tour-edit', id],
    queryFn: async () => {
      const payload = (await tourAPI.managerList()).data?.data ?? {};
      return (payload.items || []).find((item) => item.id === id) || null;
    },
    enabled: Boolean(id),
  });

  const { data: managerMeta } = useQuery({
    queryKey: ['manager-tour-meta'],
    queryFn: async () => (await tourAPI.managerMeta()).data?.data ?? {},
  });

  const guides = managerMeta?.guides || [];
  const partners = managerMeta?.partners || [];

  const previewUrls = useMemo(
    () => selectedFiles.map((file) => ({ name: file.name, url: URL.createObjectURL(file) })),
    [selectedFiles]
  );

  const mutation = useMutation({
    mutationFn: (values) => {
      const formData = buildTourFormData(values, selectedFiles);
      return id ? tourAPI.update(id, formData) : tourAPI.create(formData);
    },
    onSuccess: () => {
      toast.success(id ? 'Cập nhật tour thành công' : 'Tạo tour thành công');
      setSelectedFiles([]);
      navigate('/manager/tours');
    },
    onError: (error) => toast.error(formatApiError(error)),
  });

  const openPresetModal = (field, values) => {
    const options = presetGroups[field]?.options || [];
    const currentValues = (values[field] || []).filter(Boolean);
    setPresetSelection(currentValues.filter((item) => options.includes(item)));
    setPresetModal(field);
  };

  const togglePresetSelection = (value) => {
    setPresetSelection((current) => (
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    ));
  };

  const applyPresetSelection = (values, setFieldValue) => {
    const group = presetGroups[presetModal];
    if (! group) return;

    const currentValues = (values[presetModal] || []).filter(Boolean);
    const customValues = currentValues.filter((item) => ! group.options.includes(item));
    const nextValues = [...customValues, ...presetSelection];

    setFieldValue(presetModal, nextValues);
    setPresetModal(null);
    setPresetSelection([]);
  };

  const applyQuickTemplate = (template, setFieldValue) => {
    if (! template) return;

    Object.entries(template.values).forEach(([field, value]) => {
      setFieldValue(field, value);
    });

    setFieldValue('promotion_type', 'none');
    setFieldValue('promotion_value', 0);
    setFieldValue('status', 'draft');
    setFieldValue('departures', [
      { date: futureDateString(30), available_slots: template.values.max_pax, price_override: '', status: 'active', assigned_guide_id: '' },
      { date: futureDateString(45), available_slots: template.values.max_pax, price_override: '', status: 'active', assigned_guide_id: '' },
    ]);
  };

  return (
    <div className="rounded-4 border bg-white p-4 shadow-sm">
      <div className="mb-4 d-flex justify-content-between align-items-center">
        <div>
          <h2 className="h4 mb-1">{id ? 'Chỉnh sửa tour' : 'Tạo tour mới'}</h2>
          <p className="mb-0 text-muted">Nhập thông tin tour, khuyến mãi, đối tác, lịch trình và phân công hướng dẫn viên theo ngày.</p>
        </div>
      </div>

      <Formik
        initialValues={{
          title: editSeed?.title || '',
          category: editSeed?.category || '',
          destination: editSeed?.destination || '',
          duration_days: editSeed?.duration_days || 3,
          max_pax: editSeed?.max_pax || 10,
          price_per_person: editSeed?.price_per_person || 1000000,
          promotion_type: editSeed?.promotion_type || 'none',
          promotion_value: editSeed?.promotion_value || 0,
          status: editSeed?.status || 'draft',
          description: editSeed?.description || '',
          highlights: editSeed?.highlights?.length ? editSeed.highlights : [],
          destination_overview: editSeed?.destination_overview || '',
          historical_background: editSeed?.historical_background || '',
          local_culture: editSeed?.local_culture?.length ? editSeed.local_culture : [],
          best_time_to_visit: editSeed?.best_time_to_visit || '',
          weather_notes: editSeed?.weather_notes || '',
          included_services: editSeed?.included_services?.length ? editSeed.included_services : [],
          excluded_services: editSeed?.excluded_services?.length ? editSeed.excluded_services : [],
          suitable_for: editSeed?.suitable_for?.length ? editSeed.suitable_for : [],
          travel_tips: editSeed?.travel_tips?.length ? editSeed.travel_tips : [],
          meeting_point: editSeed?.meeting_point || '',
          linked_partner_ids: editSeed?.linked_partner_ids?.length ? editSeed.linked_partner_ids : [],
          itinerary: editSeed?.itinerary?.length ? editSeed.itinerary : [{ day: 1, title: '', description: '' }],
          departures: editSeed?.departures?.length
            ? editSeed.departures
            : [{ date: '', available_slots: 10, price_override: '', status: 'active', assigned_guide_id: '' }],
          images: editSeed?.images?.length ? editSeed.images : [''],
        }}
        enableReinitialize
        onSubmit={(values) => mutation.mutate(values)}
      >
        {({ values, setFieldValue }) => (
          <Form>
            <ul className="nav nav-tabs mb-4">
              {tabs.map((tab) => (
                <li className="nav-item" key={tab}>
                  <button type="button" className={`nav-link ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
                    {tabLabels[tab]}
                  </button>
                </li>
              ))}
            </ul>

            {activeTab === 'basic' && (
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label">Mẫu tour nhanh</label>
                  <select
                    className="form-select"
                    defaultValue=""
                    onChange={(event) => {
                      const template = quickTourTemplates.find((item) => item.id === event.target.value);
                      applyQuickTemplate(template, setFieldValue);
                    }}
                  >
                    <option value="">Chọn mẫu để tự điền nội dung</option>
                    {quickTourTemplates.map((template) => (
                      <option key={template.id} value={template.id}>{template.label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Tên tour</label>
                  <Field name="title" className="form-control" placeholder="Tên tour có thể sửa sau khi chọn mẫu" />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Danh mục</label>
                  <Field as="select" name="category" className="form-select">
                    <option value="">Chọn danh mục</option>
                    {values.category && ! categoryOptions.includes(values.category) ? <option value={values.category}>{values.category}</option> : null}
                    {categoryOptions.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </Field>
                </div>
                <div className="col-md-3">
                  <label className="form-label">Trạng thái</label>
                  <Field as="select" name="status" className="form-select">
                    <option value="draft">Bản nháp</option>
                    <option value="pending">Chờ duyệt</option>
                  </Field>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Điểm đến</label>
                  <Field as="select" name="destination" className="form-select">
                    <option value="">Chọn điểm đến</option>
                    {values.destination && ! destinationOptions.includes(values.destination) ? <option value={values.destination}>{values.destination}</option> : null}
                    {destinationOptions.map((destination) => (
                      <option key={destination} value={destination}>{destination}</option>
                    ))}
                  </Field>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Số ngày</label>
                  <Field as="select" name="duration_days" className="form-select">
                    {values.duration_days && ! durationOptions.includes(Number(values.duration_days)) ? <option value={values.duration_days}>{values.duration_days} ngày</option> : null}
                    {durationOptions.map((duration) => (
                      <option key={duration} value={duration}>{duration} ngày</option>
                    ))}
                  </Field>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Số khách tối đa</label>
                  <Field as="select" name="max_pax" className="form-select">
                    {values.max_pax && ! maxPaxOptions.includes(Number(values.max_pax)) ? <option value={values.max_pax}>{values.max_pax} khách</option> : null}
                    {maxPaxOptions.map((maxPax) => (
                      <option key={maxPax} value={maxPax}>{maxPax} khách</option>
                    ))}
                  </Field>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Giá gốc mỗi khách</label>
                  <Field as="select" name="price_per_person" className="form-select">
                    {values.price_per_person && ! priceOptions.includes(Number(values.price_per_person)) ? (
                      <option value={values.price_per_person}>{Number(values.price_per_person).toLocaleString('vi-VN')} đ</option>
                    ) : null}
                    {priceOptions.map((price) => (
                      <option key={price} value={price}>{price.toLocaleString('vi-VN')} đ</option>
                    ))}
                  </Field>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Khuyến mãi</label>
                  <select
                    name="promotion_type"
                    className="form-select"
                    value={values.promotion_type}
                    onChange={(event) => {
                      setFieldValue('promotion_type', event.target.value);
                      if (event.target.value === 'none') setFieldValue('promotion_value', 0);
                    }}
                  >
                    <option value="none">Không khuyến mãi</option>
                    <option value="percent">Giảm theo %</option>
                    <option value="fixed">Giảm số tiền cố định</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Giá trị khuyến mãi</label>
                  <Field name="promotion_value" type="number" className="form-control" disabled={values.promotion_type === 'none'} />
                </div>
                <div className="col-12">
                  <label className="form-label">Mô tả</label>
                  <Field as="textarea" name="description" rows="5" className="form-control" placeholder="Chọn mẫu tour nhanh để tự điền mô tả, sau đó sửa lại nếu cần." />
                </div>
                <div className="col-12">
                  <PresetPickerPanel
                    title="Điểm nổi bật"
                    field="highlights"
                    values={values}
                    onOpen={openPresetModal}
                    setFieldValue={setFieldValue}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label">Liên kết đối tác dịch vụ</label>
                  <FieldArray name="linked_partner_ids">
                    {({ push, remove }) => (
                      <div className="row g-2">
                        {partners.map((partner) => {
                          const checked = values.linked_partner_ids.includes(partner.id);
                          return (
                            <div className="col-md-6" key={partner.id}>
                              <label className="d-flex align-items-start gap-2 rounded-3 border p-3">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(event) => {
                                    if (event.target.checked) {
                                      push(partner.id);
                                    } else {
                                      const index = values.linked_partner_ids.indexOf(partner.id);
                                      if (index >= 0) remove(index);
                                    }
                                  }}
                                />
                                <span>
                                  <strong>{partner.company_name}</strong>
                                  <br />
                                  <span className="small text-muted">{partner.service_type}</span>
                                </span>
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </FieldArray>
                </div>
              </div>
            )}

            {activeTab === 'details' && (
              <div className="row g-4">
                <div className="col-lg-6">
                  <div className="rounded-3 border p-3 h-100">
                    <h3 className="h6 mb-3">Thông tin điểm đến</h3>
                    <Field as="textarea" name="destination_overview" rows="5" className="form-control" placeholder="Mô tả ngắn về điểm đến, cảnh quan, trải nghiệm chính..." />
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="rounded-3 border p-3 h-100">
                    <h3 className="h6 mb-3">Lịch sử / bối cảnh</h3>
                    <Field as="textarea" name="historical_background" rows="5" className="form-control" placeholder="Ghi chú về lịch sử, văn hóa, nguồn gốc hoặc câu chuyện địa phương..." />
                  </div>
                </div>
                <div className="col-lg-6">
                  <PresetPickerPanel
                    title="Văn hóa địa phương"
                    field="local_culture"
                    values={values}
                    onOpen={openPresetModal}
                    setFieldValue={setFieldValue}
                  />
                </div>
                <div className="col-lg-6">
                  <div className="rounded-3 border p-3 h-100 d-grid gap-3">
                    <div>
                      <h3 className="h6 mb-2">Thời điểm đẹp nhất để đi</h3>
                      <Field as="select" name="best_time_to_visit" className="form-select">
                        <option value="">Chọn thời điểm</option>
                        {values.best_time_to_visit && ! bestTimeOptions.includes(values.best_time_to_visit) ? (
                          <option value={values.best_time_to_visit}>{values.best_time_to_visit}</option>
                        ) : null}
                        {bestTimeOptions.map((item) => (
                          <option key={item} value={item}>{item}</option>
                        ))}
                      </Field>
                    </div>
                    <div>
                      <h3 className="h6 mb-2">Ghi chú thời tiết</h3>
                      <Field as="textarea" name="weather_notes" rows="4" className="form-control" placeholder="Lưu ý về khí hậu, mưa nắng, nhiệt độ..." />
                    </div>
                  </div>
                </div>
                <div className="col-lg-6">
                  <PresetPickerPanel
                    title="Dịch vụ bao gồm"
                    field="included_services"
                    values={values}
                    onOpen={openPresetModal}
                    setFieldValue={setFieldValue}
                  />
                </div>
                <div className="col-lg-6">
                  <PresetPickerPanel
                    title="Dịch vụ không bao gồm"
                    field="excluded_services"
                    values={values}
                    onOpen={openPresetModal}
                    setFieldValue={setFieldValue}
                  />
                </div>
                <div className="col-lg-6">
                  <PresetPickerPanel
                    title="Phù hợp với"
                    field="suitable_for"
                    values={values}
                    onOpen={openPresetModal}
                    setFieldValue={setFieldValue}
                  />
                </div>
                <div className="col-lg-6">
                  <div className="rounded-3 border p-3 h-100">
                    <h3 className="h6 mb-3">Điểm tập trung</h3>
                    <Field as="select" name="meeting_point" className="form-select">
                      <option value="">Chọn điểm tập trung</option>
                      {values.meeting_point && ! meetingPointOptions.includes(values.meeting_point) ? (
                        <option value={values.meeting_point}>{values.meeting_point}</option>
                      ) : null}
                      {meetingPointOptions.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </Field>
                    <div className="form-text">Mô tả rõ địa điểm tập trung hoặc điểm đón khách.</div>
                  </div>
                </div>
                <div className="col-12">
                  <PresetPickerPanel
                    title="Lưu ý khi đi tour"
                    field="travel_tips"
                    values={values}
                    onOpen={openPresetModal}
                    setFieldValue={setFieldValue}
                  />
                </div>
              </div>
            )}

            {activeTab === 'itinerary' && (
              <FieldArray name="itinerary">
                {({ push, remove }) => (
                  <div className="d-grid gap-3">
                    {values.itinerary.map((_, index) => (
                      <div className="rounded-3 border p-3" key={index}>
                        <div className="row g-3">
                          <div className="col-md-2">
                            <label className="form-label">Ngày</label>
                            <Field name={`itinerary.${index}.day`} type="number" className="form-control" />
                          </div>
                          <div className="col-md-10">
                            <label className="form-label">Tiêu đề</label>
                            <Field name={`itinerary.${index}.title`} className="form-control" />
                          </div>
                          <div className="col-12">
                            <label className="form-label">Mô tả</label>
                            <Field as="textarea" name={`itinerary.${index}.description`} rows="3" className="form-control" />
                          </div>
                        </div>
                        <button type="button" className="btn btn-outline-danger btn-sm mt-3" onClick={() => remove(index)}>
                          Xóa ngày
                        </button>
                      </div>
                    ))}
                    <button type="button" className="btn btn-outline-primary" onClick={() => push({ day: values.itinerary.length + 1, title: '', description: '' })}>
                      Thêm ngày
                    </button>
                  </div>
                )}
              </FieldArray>
            )}

            {activeTab === 'departures' && (
              <FieldArray name="departures">
                {({ push, remove }) => (
                  <div className="table-responsive">
                    <table className="table align-middle">
                      <thead>
                        <tr>
                          <th>Ngày đi</th>
                          <th>Số chỗ</th>
                          <th>Giá riêng</th>
                          <th>Trạng thái</th>
                          <th>HDV</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {values.departures.map((_, index) => (
                          <tr key={index}>
                            <td><FormikDateInput name={`departures.${index}.date`} className="form-control" /></td>
                            <td><Field name={`departures.${index}.available_slots`} type="number" className="form-control" /></td>
                            <td><Field name={`departures.${index}.price_override`} type="number" className="form-control" /></td>
                            <td>
                              <Field as="select" name={`departures.${index}.status`} className="form-select">
                                <option value="active">Đang mở</option>
                                <option value="paused">Tạm dừng</option>
                              </Field>
                            </td>
                            <td>
                              <Field as="select" name={`departures.${index}.assigned_guide_id`} className="form-select">
                                <option value="">Chưa phân công</option>
                                {guides.map((guide) => (
                                  <option key={guide.id} value={guide.id}>
                                    {guide.name}
                                  </option>
                                ))}
                              </Field>
                            </td>
                            <td>
                              <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => remove(index)}>
                                Xóa
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      onClick={() => push({ date: '', available_slots: 10, price_override: '', status: 'active', assigned_guide_id: '' })}
                    >
                      Thêm ngày khởi hành
                    </button>
                  </div>
                )}
              </FieldArray>
            )}

            {activeTab === 'images' && (
              <div className="d-grid gap-4">
                <div>
                  <label className="form-label">Tải ảnh từ máy tính</label>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    multiple
                    className="form-control"
                    onChange={(event) => setSelectedFiles(Array.from(event.target.files || []))}
                  />
                  <div className="form-text">Có thể chọn nhiều ảnh cùng lúc. Mỗi ảnh tối đa 5MB.</div>
                </div>

                {previewUrls.length > 0 && (
                  <div className="row g-3">
                    {previewUrls.map((file) => (
                      <div className="col-md-4" key={file.name}>
                        <div className="h-100 rounded-3 border p-2">
                          <img src={file.url} alt={file.name} className="img-fluid rounded mb-2" />
                          <div className="small text-muted text-truncate">{file.name}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <FieldArray name="images">
                  {({ push, remove }) => (
                    <div className="d-grid gap-3">
                      <div>
                        <label className="form-label">Hoặc nhập URL ảnh có sẵn</label>
                        <div className="form-text mb-3">Giữ lại hoặc bổ sung thêm ảnh từ link ngoài nếu cần.</div>
                      </div>

                      {values.images.map((image, index) => (
                        <div className="row g-3 align-items-center" key={index}>
                          <div className="col-lg-8">
                            <Field name={`images.${index}`} className="form-control" placeholder="https://example.com/anh-tour.jpg" />
                          </div>
                          <div className="col-lg-2">
                            {image ? <img src={image} alt="preview" className="img-fluid rounded border" /> : <div className="small text-muted">Xem trước</div>}
                          </div>
                          <div className="col-lg-2">
                            <button type="button" className="btn btn-outline-danger w-100" onClick={() => remove(index)}>
                              Xóa
                            </button>
                          </div>
                        </div>
                      ))}
                      <button type="button" className="btn btn-outline-primary" onClick={() => push('')}>
                        Thêm URL ảnh
                      </button>
                    </div>
                  )}
                </FieldArray>
              </div>
            )}

            {presetModal && (
              <>
                <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
                  <div className="modal-dialog modal-dialog-scrollable modal-lg">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5 className="modal-title">{presetGroups[presetModal].title}</h5>
                        <button type="button" className="btn-close" aria-label="Đóng" onClick={() => setPresetModal(null)} />
                      </div>
                      <div className="modal-body">
                        <div className="row g-2">
                          {presetGroups[presetModal].options.map((option) => (
                            <div className="col-md-6" key={option}>
                              <label className="d-flex align-items-start gap-2 rounded-3 border p-3 h-100">
                                <input
                                  type="checkbox"
                                  className="form-check-input mt-1"
                                  checked={presetSelection.includes(option)}
                                  onChange={() => togglePresetSelection(option)}
                                />
                                <span>{option}</span>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="modal-footer">
                        <button type="button" className="btn btn-light" onClick={() => setPresetModal(null)}>
                          Hủy
                        </button>
                        <button type="button" className="btn btn-primary" onClick={() => applyPresetSelection(values, setFieldValue)}>
                          Áp dụng {presetSelection.length > 0 ? `(${presetSelection.length})` : ''}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-backdrop fade show" />
              </>
            )}

            <div className="mt-4 d-flex justify-content-end gap-2">
              <button type="button" className="btn btn-light" onClick={() => navigate('/manager/tours')}>
                Hủy
              </button>
              <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
                {mutation.isPending ? 'Đang lưu...' : id ? 'Cập nhật tour' : 'Tạo tour'}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}
