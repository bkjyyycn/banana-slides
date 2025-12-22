/**
 * PPT创建流程E2E测试
 */

import { test, expect } from '@playwright/test'

test.describe('从想法创建PPT', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // 等待页面完全加载
    await page.waitForSelector('main', { timeout: 10000 })
  })

  test('完整的PPT创建流程', async ({ page }) => {
    // 1. 确认默认选中"一句话生成"（第一个tab）
    const activeTab = page.locator('button.bg-gradient-to-r.from-banana-500').first()
    await expect(activeTab).toContainText('一句话生成')
    
    // 2. 输入想法/主题
    const ideaInput = page.locator('textarea').first()
    await ideaInput.fill('生成一份关于人工智能的简短PPT，共3页')
    
    // 3. 点击"下一步"按钮
    await page.click('button:has-text("下一步")')
    
    // 4. 等待页面跳转到大纲编辑页
    await expect(page).toHaveURL(/\/project\/.*\/outline/i, { timeout: 15000 })
    
    // 5. 等待大纲生成（可能需要较长时间）
    await page.waitForSelector('.outline-card, [data-testid="outline-item"], .outline-section', {
      timeout: 60000
    })
    
    // 6. 验证大纲已生成
    const outlineItems = page.locator('.outline-card, [data-testid="outline-item"], .outline-section')
    await expect(outlineItems.first()).toBeVisible()
  })

  test('应该能看到模板选择器', async ({ page }) => {
    // 等待页面加载
    await page.waitForSelector('main')
    
    // 检查是否有模板选择区域
    const templateSection = page.locator('text=/选择风格模板/i')
    await expect(templateSection).toBeVisible()
    
    // 检查是否有文件上传输入（隐藏的）
    const fileInput = page.locator('input[type="file"]')
    const count = await fileInput.count()
    expect(count).toBeGreaterThan(0)
  })
})

test.describe('API集成测试', () => {
  test('应该能创建项目', async ({ request }) => {
    const response = await request.post('http://localhost:5000/api/projects', {
      data: {
        creation_type: 'idea',
        idea_prompt: 'E2E测试项目'
      }
    })
    
    expect(response.ok()).toBeTruthy()
    
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data.project_id).toBeTruthy()
    
    // 清理：删除测试项目
    const projectId = data.data.project_id
    await request.delete(`http://localhost:5000/api/projects/${projectId}`)
  })

  test('应该能获取项目详情', async ({ request }) => {
    // 先创建项目
    const createResponse = await request.post('http://localhost:5000/api/projects', {
      data: {
        creation_type: 'idea',
        idea_prompt: 'E2E测试项目'
      }
    })
    
    const createData = await createResponse.json()
    const projectId = createData.data.project_id
    
    // 获取详情
    const getResponse = await request.get(`http://localhost:5000/api/projects/${projectId}`)
    
    expect(getResponse.ok()).toBeTruthy()
    
    const getData = await getResponse.json()
    expect(getData.success).toBe(true)
    expect(getData.data.project_id).toBe(projectId)
    
    // 清理
    await request.delete(`http://localhost:5000/api/projects/${projectId}`)
  })
})

